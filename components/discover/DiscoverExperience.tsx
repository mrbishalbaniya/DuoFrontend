"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardActionBar } from "@/components/dashboard/DashboardActionBar";
import { DashboardMenuSheet } from "@/components/dashboard/DashboardMenuSheet";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import DiscoveryFiltersSheet from "@/components/dashboard/DiscoveryFiltersSheet";
import {
  getProfilePhotos,
  ProfileCardOverlay,
  ProfileDetailSheet,
} from "@/components/discover/profileDiscoverUi";
import { DiscoverPageSkeleton } from "@/components/skeletons/DiscoverPageSkeleton";
import { PremiumUpgradeSheet } from "@/components/subscription/PremiumUpgradeSheet";
import {
  SwipeableCardStack,
  type SwipeDirection,
  type SwipeableCardStackHandle,
} from "@/components/ui/tinder-like-swipe";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import api, { LikeLimitError } from "@/lib/api";
import { submitEsewaPayment } from "@/lib/esewa";
import { SHEET_ANCHOR_ID } from "@/lib/useSheetAnchor";
import {
  countActiveFilters,
  filtersFromProfile,
  type DiscoveryFilters,
} from "@/lib/discoveryFilters";
import { detectUserLocation, isDefaultLocation } from "@/lib/geolocation";
import type { LikeQuota, Profile, SubscriptionPlan, SwipeAction, WalletSummary } from "@/types";

/** Desktop-only filter icon above the card (phones use the one in the top bar). */
function FilterIconButton({
  activeCount,
  onOpenFilters,
  disabled = false,
}: {
  activeCount: number;
  onOpenFilters: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={`mx-auto hidden w-full shrink-0 justify-end pb-2 pt-1 md:flex ${MATCH_CARD_WIDTH}`}>
      <button
        type="button"
        aria-label={activeCount > 0 ? `Open discovery filters, ${activeCount} active` : "Open discovery filters"}
        title="Filters"
        disabled={disabled}
        onClick={onOpenFilters}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-background text-primary shadow-[0_4px_16px] shadow-primary/10 transition-all hover:bg-secondary active:scale-95 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[24px]">tune</span>
        {activeCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white gradient-brand">
            {activeCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}

const MATCH_CARD_WIDTH =
  "w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-[30rem]";

let discoverProfilesCache: Profile[] | null = null;

/** Out of free Likes right now (the backend is the source of truth). */
function likesExhausted(quota: LikeQuota | null): boolean {
  if (!quota || quota.unlimited) return false;
  if ((quota.likes_remaining ?? 0) > 0) return false;
  return !quota.reset_at || new Date(quota.reset_at).getTime() > Date.now();
}

function formatResetTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const sameDay = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return sameDay ? time : `tomorrow ${time}`;
}

/** Remaining free Likes under the action buttons; hidden for Unlimited likes. */
function LikesRemaining({ quota, onUpgrade }: { quota: LikeQuota | null; onUpgrade: () => void }) {
  if (!quota || quota.unlimited || quota.limit == null) return null;
  const remaining = quota.likes_remaining ?? 0;
  if (likesExhausted(quota)) {
    return (
      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px] text-error">heart_broken</span>
        Out of Likes until {formatResetTime(quota.reset_at)} ·
        <button type="button" onClick={onUpgrade} className="font-semibold text-primary hover:underline">
          Go unlimited
        </button>
      </p>
    );
  }
  return (
    <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-on-surface-variant" aria-live="polite">
      <span className="material-symbols-outlined text-[16px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>
        favorite
      </span>
      <span className="font-semibold tabular-nums text-on-surface">{remaining}</span>
      of {quota.limit} Likes left
      {remaining <= 10 ? (
        <>
          {" · "}
          <button type="button" onClick={onUpgrade} className="font-semibold text-primary hover:underline">
            Go unlimited
          </button>
        </>
      ) : null}
    </p>
  );
}
const discoverSwipedUserIds = new Set<number>();
/** This session's swipes, newest last — what Rewind can bring back. */
let discoverSwipeHistory: { userId: number; profile: Profile }[] = [];
const REWIND_HISTORY_LIMIT = 20;

function profileUserId(profile: Profile): number | null {
  const id = profile.user_id ?? profile.id;
  return typeof id === "number" && id > 0 ? id : null;
}

function withoutSwipedProfiles(profiles: Profile[]): Profile[] {
  return profiles.filter((profile) => {
    const id = profileUserId(profile);
    return id == null || !discoverSwipedUserIds.has(id);
  });
}

export function DiscoverExperience() {
  const { user, loading: authLoading, fetchUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(() =>
    withoutSwipedProfiles(discoverProfilesCache ?? [])
  );
  const [widening, setWidening] = useState(false);
  const [loading, setLoading] = useState(() => discoverProfilesCache === null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [discoverInfoOpen, setDiscoverInfoOpen] = useState(false);
  const [stackKey, setStackKey] = useState(0);
  const [swipeHistoryCount, setSwipeHistoryCount] = useState(discoverSwipeHistory.length);
  const [rewindUnlocked, setRewindUnlocked] = useState<boolean | null>(null);
  const [rewinding, setRewinding] = useState(false);
  const [rewindSheetOpen, setRewindSheetOpen] = useState(false);
  const [rewindPlans, setRewindPlans] = useState<SubscriptionPlan[]>([]);
  const [likeQuota, setLikeQuota] = useState<LikeQuota | null>(null);
  const [likesSheetOpen, setLikesSheetOpen] = useState(false);
  const [likesPlans, setLikesPlans] = useState<SubscriptionPlan[]>([]);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  /** In-flight swipe requests, so a rewind never races the swipe it undoes. */
  const pendingSwipesRef = useRef(new Map<number, Promise<unknown>>());
  const swipingRef = useRef(false);
  const stackRef = useRef<SwipeableCardStackHandle>(null);
  const locationSyncedRef = useRef(false);
  const profilesFetchedRef = useRef(discoverProfilesCache !== null);

  const fetchProfiles = useCallback(
    async (options?: { silent?: boolean; clearSwiped?: boolean }) => {
      if (!options?.silent) setLoading(true);
      try {
        if (options?.clearSwiped) {
          discoverSwipedUserIds.clear();
        }
        const result = await api.discoverProfiles();
        const filtered = withoutSwipedProfiles(result.profiles);
        discoverProfilesCache = filtered;
        setProfiles(filtered);
        return filtered.length;
      } catch {
        discoverProfilesCache = [];
        setProfiles([]);
        return 0;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!authLoading && user && !profilesFetchedRef.current) {
      profilesFetchedRef.current = true;
      void fetchProfiles({ silent: discoverProfilesCache !== null });
    }
  }, [user, authLoading, router, fetchProfiles]);

  useEffect(() => {
    if (!user || locationSyncedRef.current) return;

    const location = user.profile?.location;
    if (!isDefaultLocation(location)) return;

    locationSyncedRef.current = true;
    void (async () => {
      try {
        const detected = await detectUserLocation();
        await api.updateProfile({ location: detected.label });
        await fetchUser();
      } catch {
        locationSyncedRef.current = false;
      }
    })();
  }, [user, fetchUser]);

  const currentProfile = profiles[0];
  const deckProfiles = useMemo(() => profiles.slice(0, 4), [profiles]);
  const deckImages = useMemo(
    () => [...deckProfiles].reverse().map((profile) => getProfilePhotos(profile)[0]),
    [deckProfiles]
  );

  useEffect(() => {
    setDiscoverInfoOpen(false);
  }, [currentProfile?.user_id, currentProfile?.id]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .getSubscriptionStatus()
      .then((status) => {
        if (!cancelled) setRewindUnlocked(Boolean(status.features?.rewind?.is_active));
      })
      .catch(() => {
        if (!cancelled) setRewindUnlocked(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const refreshLikeQuota = useCallback(() => {
    api
      .getLikeQuota()
      .then(setLikeQuota)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (user) refreshLikeQuota();
  }, [user, refreshLikeQuota]);

  useEffect(() => {
    if (!likeQuota?.reset_at || likeQuota.unlimited) return;
    const wait = new Date(likeQuota.reset_at).getTime() - Date.now();
    if (wait <= 0 || wait > 24 * 60 * 60 * 1000) return;
    const timer = setTimeout(refreshLikeQuota, wait + 1000);
    return () => clearTimeout(timer);
  }, [likeQuota, refreshLikeQuota]);

  const openLikesPaywall = useCallback(async () => {
    setLikesSheetOpen(true);
    const [plans, walletData] = await Promise.all([
      api.getSubscriptionPlans("unlimited_likes").catch(() => [] as SubscriptionPlan[]),
      api.getWallet().catch(() => null),
    ]);
    setLikesPlans(plans);
    setWallet(walletData);
  }, []);

  const savedFilters = useMemo(() => filtersFromProfile(user?.profile), [user?.profile]);
  const activeFilterCount = countActiveFilters(savedFilters);

  const applyFilters = useCallback(
    async (filters: Partial<DiscoveryFilters>) => {
      await api.updateProfile(filters);
      await fetchUser();
      setStackKey((key) => key + 1);
      discoverProfilesCache = null;
      profilesFetchedRef.current = true;
      return fetchProfiles({ clearSwiped: true });
    },
    [fetchProfiles, fetchUser]
  );

  const handleApplyFilters = useCallback(
    async (filters: DiscoveryFilters) => {
      const found = await applyFilters(filters);
      showToast(
        found > 0
          ? `Filters applied. ${found} ${found === 1 ? "person matches" : "people match"} right now.`
          : "Filters applied. Nobody matches yet, so try widening your search.",
        { variant: found > 0 ? "success" : "warning" }
      );
    },
    [applyFilters, showToast]
  );

  const handleWidenSearch = useCallback(async () => {
    setWidening(true);
    try {
      await applyFilters({ pref_expand_distance: true, pref_expand_age: true });
    } catch {
      showToast("Could not update your search. Please try again.", { variant: "error" });
    } finally {
      setWidening(false);
    }
  }, [applyFilters, showToast]);

  const handleSwipe = useCallback(
    (action: SwipeAction, profile: Profile): boolean => {
      if (swipingRef.current) return false;

      const toUserId = profileUserId(profile);
      if (!toUserId) {
        console.error("Swipe error: profile is missing user id", profile);
        return false;
      }

      // Brief lock so the same card can't be committed twice — unlock right after
      // optimistic remove so the next card stays swipeable while the API runs.
      swipingRef.current = true;

      discoverSwipedUserIds.add(toUserId);
      discoverSwipeHistory = [
        ...discoverSwipeHistory.filter((entry) => entry.userId !== toUserId),
        { userId: toUserId, profile },
      ].slice(-REWIND_HISTORY_LIMIT);
      setSwipeHistoryCount(discoverSwipeHistory.length);
      let nextProfiles: Profile[] = [];
      setProfiles((current) => {
        nextProfiles = current.filter((p) => profileUserId(p) !== toUserId);
        discoverProfilesCache = nextProfiles;
        return nextProfiles;
      });
      swipingRef.current = false;

      if (nextProfiles.length === 0) {
        // Keep session swipes so recycled discover results don't re-show
        // the same people immediately after a left/right swipe.
        void fetchProfiles({ silent: true, clearSwiped: false });
      }

      const request = (async () => {
        try {
          const res = await api.swipe(toUserId, action);
          if (res.likes) setLikeQuota(res.likes);
          if (res.is_match && res.match) {
            // A match can't be rewound, so drop it from the rewind history.
            discoverSwipeHistory = discoverSwipeHistory.filter((entry) => entry.userId !== toUserId);
            setSwipeHistoryCount(discoverSwipeHistory.length);
            sessionStorage.setItem("latest_match", JSON.stringify(res.match));
            router.push("/match/celebration");
          }
        } catch (err) {
          if (err instanceof LikeLimitError) {
            if (err.quota) setLikeQuota(err.quota);
            showToast(err.message, { variant: "info" });
            void openLikesPaywall();
          } else {
            console.error("Swipe error:", err);
          }
          discoverSwipedUserIds.delete(toUserId);
          discoverSwipeHistory = discoverSwipeHistory.filter((entry) => entry.userId !== toUserId);
          setSwipeHistoryCount(discoverSwipeHistory.length);
          setProfiles((current) => {
            if (current.some((p) => profileUserId(p) === toUserId)) {
              discoverProfilesCache = current;
              return current;
            }
            const restored = [profile, ...current];
            discoverProfilesCache = restored;
            return restored;
          });
          setStackKey((key) => key + 1);
        } finally {
          pendingSwipesRef.current.delete(toUserId);
        }
      })();
      pendingSwipesRef.current.set(toUserId, request);

      return true;
    },
    [fetchProfiles, openLikesPaywall, router, showToast]
  );

  const handleStackSwipe = useCallback(
    (direction: SwipeDirection, _image: string, stackIndex: number) => {
      if (filtersOpen || discoverInfoOpen || menuOpen) return false;
      if (swipingRef.current) return false;

      const profile = deckProfiles[deckProfiles.length - 1 - stackIndex];
      if (!profile) return false;

      const action: SwipeAction = direction === "right" ? "LIKE" : "SKIP";
      if (action === "LIKE" && likesExhausted(likeQuota)) {
        void openLikesPaywall();
        return false;
      }
      return handleSwipe(action, profile);
    },
    [deckProfiles, discoverInfoOpen, filtersOpen, handleSwipe, likeQuota, menuOpen, openLikesPaywall]
  );

  const openRewindPaywall = useCallback(async () => {
    setRewindSheetOpen(true);
    const [plans, walletData] = await Promise.all([
      api.getSubscriptionPlans("rewind").catch(() => [] as SubscriptionPlan[]),
      api.getWallet().catch(() => null),
    ]);
    setRewindPlans(plans);
    setWallet(walletData);
  }, []);

  const performRewind = useCallback(async () => {
    const last = discoverSwipeHistory[discoverSwipeHistory.length - 1];
    if (!last || rewinding) return;
    setRewinding(true);
    try {
      await pendingSwipesRef.current.get(last.userId);
      const result = await api.rewindSwipe(last.userId);
      const restored = result.profile ?? last.profile;
      discoverSwipeHistory = discoverSwipeHistory.slice(0, -1);
      setSwipeHistoryCount(discoverSwipeHistory.length);
      discoverSwipedUserIds.delete(last.userId);
      setProfiles((current) => {
        const next = [restored, ...current.filter((p) => profileUserId(p) !== last.userId)];
        discoverProfilesCache = next;
        return next;
      });
      setStackKey((key) => key + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not rewind. Please try again.";
      if (/premium|rewind pass/i.test(message)) {
        setRewindUnlocked(false);
        void openRewindPaywall();
      } else {
        if (/no swipe|already matched/i.test(message)) {
          discoverSwipeHistory = discoverSwipeHistory.slice(0, -1);
          setSwipeHistoryCount(discoverSwipeHistory.length);
        }
        showToast(message, { variant: "error" });
      }
    } finally {
      setRewinding(false);
    }
  }, [openRewindPaywall, rewinding, showToast]);

  const handleRewind = useCallback(() => {
    if (rewindUnlocked === false) {
      void openRewindPaywall();
      return;
    }
    void performRewind();
  }, [openRewindPaywall, performRewind, rewindUnlocked]);

  const handleBuyRewind = useCallback(
    async (planId: string) => {
      setPurchasing(true);
      try {
        const result = await api.purchaseWithWallet(planId);
        setWallet((prev) => (prev ? { ...prev, balance: result.balance } : prev));
        setRewindUnlocked(true);
        setRewindSheetOpen(false);
        showToast("Rewind unlocked. Bringing back your last swipe…", { variant: "success" });
        void fetchUser();
        await performRewind();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Purchase failed. Please try again.", {
          variant: "error",
        });
      } finally {
        setPurchasing(false);
      }
    },
    [fetchUser, performRewind, showToast]
  );

  const handleBuyUnlimitedLikes = useCallback(
    async (planId: string) => {
      setPurchasing(true);
      try {
        const result = await api.purchaseWithWallet(planId);
        setWallet((prev) => (prev ? { ...prev, balance: result.balance } : prev));
        setLikesSheetOpen(false);
        showToast("Unlimited likes unlocked. Like away!", { variant: "success" });
        refreshLikeQuota();
        void fetchUser();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Purchase failed. Please try again.", {
          variant: "error",
        });
      } finally {
        setPurchasing(false);
      }
    },
    [fetchUser, refreshLikeQuota, showToast]
  );

  const handleTopUp = useCallback(
    async (amount: number) => {
      setToppingUp(true);
      try {
        const payment = await api.initiateWalletTopUp(amount);
        submitEsewaPayment(payment.payment_url, payment.form);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Could not start eSewa top-up.", {
          variant: "error",
        });
        setToppingUp(false);
      }
    },
    [showToast]
  );

  const rewindSheet = (
    <PremiumUpgradeSheet
      open={rewindSheetOpen}
      onClose={() => setRewindSheetOpen(false)}
      plans={rewindPlans}
      count={0}
      variant="rewind"
      walletBalance={wallet?.balance ?? 0}
      topUpPresets={wallet?.top_up_presets}
      purchasing={purchasing}
      toppingUp={toppingUp}
      onPurchase={(planId) => void handleBuyRewind(planId)}
      onTopUp={(amount) => void handleTopUp(amount)}
    />
  );

  const likesSheet = (
    <PremiumUpgradeSheet
      open={likesSheetOpen}
      onClose={() => setLikesSheetOpen(false)}
      plans={likesPlans}
      count={0}
      variant="unlimited_likes"
      walletBalance={wallet?.balance ?? 0}
      topUpPresets={wallet?.top_up_presets}
      purchasing={purchasing}
      toppingUp={toppingUp}
      onPurchase={(planId) => void handleBuyUnlimitedLikes(planId)}
      onTopUp={(amount) => void handleTopUp(amount)}
    />
  );

  const userProfile = user?.profile ?? null;
  const sheetOpen = filtersOpen || discoverInfoOpen || menuOpen;
  // Never freeze the deck while a swipe API is in flight.
  const controlsDisabled = sheetOpen;

  const triggerSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (controlsDisabled) return;
      stackRef.current?.swipeTop(direction);
    },
    [controlsDisabled]
  );

  if (authLoading || loading) {
    return <DiscoverPageSkeleton />;
  }

  if (!currentProfile) {
    const canWiden = !savedFilters.pref_expand_distance || !savedFilters.pref_expand_age;
    const filtered = activeFilterCount > 0 || canWiden;
    return (
      <>
        <main className="mobile-bottom-nav-offset flex h-full min-h-0 flex-col overflow-hidden px-4 pt-2 md:px-6 md:pb-8 lg:px-8">
          <div className="shrink-0 md:hidden">
            <DashboardTopBar
              onOpenMenu={() => setMenuOpen(true)}
              onOpenFilters={() => setFiltersOpen(true)}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <FilterIconButton
            activeCount={activeFilterCount}
            onOpenFilters={() => setFiltersOpen(true)}
          />
          <div className={`mx-auto flex min-h-0 flex-1 items-center justify-center overflow-hidden ${MATCH_CARD_WIDTH}`}>
            <div className="space-y-5 px-2 text-center md:px-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <span className="material-symbols-outlined text-5xl text-primary/70">
                  {filtered ? "filter_alt_off" : "favorite"}
                </span>
              </div>
              <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface md:text-3xl">
                {filtered ? "No one matches your filters" : "You are all caught up"}
              </h2>
              <p className="mx-auto max-w-md text-on-surface-variant md:text-base">
                {filtered
                  ? "Try a wider age range, a bigger distance, or fewer requirements. New people join Duo every day."
                  : "You have seen everyone available right now. Check back soon as new people join Duo."}
              </p>
              {swipeHistoryCount > 0 ? (
                <button
                  type="button"
                  onClick={handleRewind}
                  disabled={rewinding}
                  className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 px-4 py-2 text-sm font-semibold text-amber-400 transition-all hover:bg-amber-400/10 active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">replay</span>
                  Rewind last swipe
                  {rewindUnlocked === false ? (
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      lock
                    </span>
                  ) : null}
                </button>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="rounded-full border border-primary/20 bg-background px-8 py-3 font-bold text-primary shadow-sm transition-all hover:bg-secondary active:scale-95 md:px-10 md:py-3.5"
                >
                  Adjust filters
                </button>
                {canWiden ? (
                  <button
                    onClick={() => void handleWidenSearch()}
                    disabled={widening}
                    className="rounded-full px-8 py-3 font-bold text-white shadow-lg transition-all gradient-brand active:scale-95 disabled:opacity-60 md:px-10 md:py-3.5"
                  >
                    {widening ? "Widening…" : "Widen my search"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      void fetchProfiles({ clearSwiped: true });
                    }}
                    className="rounded-full px-8 py-3 font-bold text-white shadow-lg transition-all gradient-brand active:scale-95 md:px-10 md:py-3.5"
                  >
                    Refresh
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
        <DashboardMenuSheet
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onOpenFilters={() => setFiltersOpen(true)}
        />
        <DiscoveryFiltersSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          profile={user?.profile ?? null}
          onApply={handleApplyFilters}
        />
        {rewindSheet}
        {likesSheet}
      </>
    );
  }

  return (
    <>
      <main className="mobile-bottom-nav-offset flex h-full min-h-0 flex-col overflow-hidden px-4 pt-2 md:px-6 md:pb-8 lg:px-8">
        <div className="shrink-0 md:hidden">
          <DashboardTopBar
            onOpenMenu={() => setMenuOpen(true)}
            onOpenFilters={() => setFiltersOpen(true)}
            disabled={controlsDisabled}
            activeFilterCount={activeFilterCount}
          />
        </div>

        <FilterIconButton
          activeCount={activeFilterCount}
          onOpenFilters={() => setFiltersOpen(true)}
          disabled={controlsDisabled}
        />

        <div id={SHEET_ANCHOR_ID} className={`relative mx-auto mt-1 min-h-0 flex-1 md:mt-2 ${MATCH_CARD_WIDTH}`}>
          <SwipeableCardStack
            ref={stackRef}
            key={stackKey}
            images={deckImages}
            borderRadius={16}
            disabled={sheetOpen}
            greenShadowColor="rgba(34, 197, 94, 0.72)"
            redShadowColor="rgba(239, 68, 68, 0.72)"
            shadowSize="0 10px 28px"
            shadowBlur="rgba(183, 110, 121, 0.14)"
            className="min-h-0"
            onSwipe={handleStackSwipe}
            renderOverlay={(stackIndex, isTopCard) => {
              const profile = deckProfiles[deckProfiles.length - 1 - stackIndex];
              if (!profile) return null;
              return (
                <ProfileCardOverlay
                  profile={profile}
                  isTopCard={isTopCard}
                  onInfoClick={() => setDiscoverInfoOpen(true)}
                  infoDisabled={controlsDisabled}
                />
              );
            }}
          />
        </div>

        <div className="shrink-0 pb-1 pt-2 md:pb-4 md:pt-4">
          <DashboardActionBar
            disabled={controlsDisabled}
            onSkip={() => triggerSwipe("left")}
            onLike={() => {
              if (likesExhausted(likeQuota)) {
                void openLikesPaywall();
                return;
              }
              triggerSwipe("right");
            }}
            onRewind={handleRewind}
            rewindDisabled={swipeHistoryCount === 0}
            rewindLocked={rewindUnlocked === false}
            rewinding={rewinding}
          />
          <LikesRemaining quota={likeQuota} onUpgrade={() => void openLikesPaywall()} />
        </div>
      </main>

      <DashboardMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      <ProfileDetailSheet
        profile={currentProfile}
        open={discoverInfoOpen}
        onClose={() => setDiscoverInfoOpen(false)}
      />

      <DiscoveryFiltersSheet
        profile={userProfile}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={handleApplyFilters}
      />

      {rewindSheet}
      {likesSheet}
    </>
  );
}
