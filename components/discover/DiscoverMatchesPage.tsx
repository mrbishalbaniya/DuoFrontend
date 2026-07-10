"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import { DashboardMenuSheet } from "@/components/dashboard/DashboardMenuSheet";
import { PremiumUpgradeSheet } from "@/components/subscription/PremiumUpgradeSheet";
import { DiscoverMatchesSkeleton } from "@/components/skeletons/DiscoverMatchesSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { submitEsewaPayment } from "@/lib/esewa";
import { resolveProfilePhotoUrl } from "@/lib/mediaUrl";
import type { LikedProfile, Profile, SubscriptionPlan, SwipeAction, VisitedProfile, WalletSummary } from "@/types";

type DiscoverTab = "visited-you" | "liked-by-you" | "likes-you";

const TAB_CONFIG: { id: DiscoverTab; label: string }[] = [
  { id: "visited-you", label: "Visited you" },
  { id: "liked-by-you", label: "Likes sent" },
  { id: "likes-you", label: "Liked you" },
];

function profilePhotoUrl(profile: Profile): string {
  return resolveProfilePhotoUrl(profile);
}

function visitedProfileKey(item: VisitedProfile): string {
  if (item.visit_id != null) return `visit-${item.visit_id}`;
  const profileId = item.profile.user_id ?? item.profile.id;
  if (profileId != null) return String(profileId);
  return `${item.visited_at ?? "unknown"}`;
}

function likedProfileKey(item: LikedProfile): string {
  if (item.swipe_id != null) return `swipe-${item.swipe_id}`;
  const profileId = item.profile.user_id ?? item.profile.id;
  if (profileId != null) return String(profileId);
  return `${item.liked_at ?? "unknown"}-${item.action ?? "like"}`;
}

function formatLikeTime(iso?: string): string {
  if (!iso) return "Recently";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function interactionTimeLabel(
  action: SwipeAction | undefined,
  kind: "matched" | "sent" | "received" | "visited",
  time?: string
): string {
  const when = formatLikeTime(time);

  if (kind === "matched") return `Matched · ${when}`;
  if (kind === "visited") return `Viewed your profile · ${when}`;
  if (kind === "sent") {
    if (action === "SUPERLIKE") return `Super like sent · ${when}`;
    return `Like sent · ${when}`;
  }
  if (action === "SUPERLIKE") return `Super like received · ${when}`;
  return `Like received · ${when}`;
}

function DiscoverProfileCard({
  profile,
  timeLabel,
  actions,
  locked = false,
  onLockedClick,
}: {
  profile: Profile;
  timeLabel: string;
  actions?: React.ReactNode;
  locked?: boolean;
  onLockedClick?: () => void;
}) {
  const name = profile.full_name || "Duo member";
  const ageText = profile.age != null ? `, ${profile.age}` : "";
  const photoUrl = profilePhotoUrl(profile);
  const distanceLabel =
    profile.preview_distance_km != null ? `${profile.preview_distance_km} km` : "Nearby";

  const cardBody = (
    <>
      <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden">
        {photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photoUrl}
            alt=""
            className={`h-full w-full object-cover ${locked ? "blur-sm" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2a2a2e] to-[#17171a]">
            <span className="material-symbols-outlined text-6xl text-white/15">person</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
          {locked ? (
            <>
              <h2 className="truncate text-[16px] font-semibold leading-tight md:text-[17px]">
                <span className="inline-block select-none text-white blur-[5px]">{name}</span>
                {ageText ? (
                  <span className="font-semibold text-white">{ageText}</span>
                ) : null}
              </h2>
              <p className="mt-1 text-[12px] font-medium text-white/75 md:text-[13px]">
                {distanceLabel}
              </p>
            </>
          ) : (
            <>
              <h2 className="truncate text-[16px] font-semibold leading-tight text-white md:text-[17px]">
                {name}
                {ageText}
              </h2>
              <p className="mt-1 truncate text-[12px] text-white/70 md:text-[13px]">{timeLabel}</p>
            </>
          )}
        </div>
      </div>

      {actions ? (
        <div className="flex min-h-[52px] items-center gap-2 p-2.5 md:min-h-[56px] md:p-3">
          {actions}
        </div>
      ) : null}
    </>
  );

  if (locked && onLockedClick) {
    return (
      <button
        type="button"
        onClick={onLockedClick}
        className="flex w-full flex-col overflow-hidden rounded-[1.25rem] bg-surface-container-high text-left ring-1 ring-outline-variant/25 transition active:scale-[0.98] md:rounded-2xl md:hover:-translate-y-0.5 md:hover:ring-primary/15"
      >
        {cardBody}
      </button>
    );
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-[1.25rem] bg-surface-container-high ring-1 ring-outline-variant/25 md:rounded-2xl md:transition-transform md:hover:-translate-y-0.5 md:hover:ring-primary/15">
      {cardBody}
    </article>
  );
}

function CardButton({
  href,
  onClick,
  icon,
  label,
  primary = false,
  full = false,
  disabled = false,
  loading = false,
}: {
  href?: string;
  onClick?: () => void;
  icon: string;
  label: string;
  primary?: boolean;
  full?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  const className = `inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-2 text-[11px] font-semibold leading-none active:scale-[0.98] md:gap-1.5 md:px-3 md:py-2.5 md:text-xs ${
    full ? "w-full" : "flex-1"
  } ${
    primary
      ? "bg-primary text-white"
      : "bg-secondary text-on-surface"
  } ${disabled || loading ? "pointer-events-none opacity-60" : ""}`;

  const content = (
    <>
      <span className="material-symbols-outlined text-[15px]">{icon}</span>
      {label}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={href ?? "#"} className={className}>
      {content}
    </Link>
  );
}

function VisitedYouCard({
  item,
  onLockedClick,
}: {
  item: VisitedProfile;
  onLockedClick: () => void;
}) {
  const profile = item.profile;
  if (!profile) return null;
  const locked = item.locked ?? false;

  return (
    <DiscoverProfileCard
      profile={profile}
      locked={locked}
      onLockedClick={locked ? onLockedClick : undefined}
      timeLabel={interactionTimeLabel(undefined, "visited", item.visited_at)}
      actions={
        locked ? undefined : (
          <CardButton href="/match" icon="favorite" label="Like on Match" primary full />
        )
      }
    />
  );
}

function LikedByYouCard({ item }: { item: LikedProfile }) {
  const profile = item.profile;
  if (!profile) return null;

  return (
    <DiscoverProfileCard
      profile={profile}
      timeLabel={interactionTimeLabel(item.action, "sent", item.liked_at)}
      actions={
        <CardButton href="/match" icon="swipe" label="Keep swiping" full />
      }
    />
  );
}

function LikesYouCard({
  item,
  onLockedClick,
  onLikeBack,
  likingBack,
}: {
  item: LikedProfile;
  onLockedClick: () => void;
  onLikeBack: (item: LikedProfile) => void;
  likingBack?: boolean;
}) {
  const profile = item.profile;
  if (!profile) return null;
  const locked = item.locked ?? false;

  return (
    <DiscoverProfileCard
      profile={profile}
      locked={locked}
      onLockedClick={locked ? onLockedClick : undefined}
      timeLabel={interactionTimeLabel(item.action, "received", item.liked_at)}
      actions={
        locked ? undefined : (
          <CardButton
            onClick={() => onLikeBack(item)}
            icon="favorite"
            label={likingBack ? "Liking…" : "Like back"}
            primary
            full
            disabled={likingBack}
            loading={likingBack}
          />
        )
      }
    />
  );
}

function EmptyState({ tab }: { tab: DiscoverTab }) {
  const content = {
    "visited-you": {
      icon: "visibility",
      title: "No profile visits yet",
      description: "When someone views your profile, they'll appear here.",
      cta: { href: "/match", label: "Update your profile" },
    },
    "liked-by-you": {
      icon: "thumb_up",
      title: "No Likes Yet",
      description: "Profiles you like will appear here until they like you back.",
      cta: { href: "/match", label: "Discover Profiles" },
    },
    "likes-you": {
      icon: "favorite",
      title: "No Likes Yet",
      description: "When someone likes you, they'll appear here so you can match back.",
      cta: { href: "/match", label: "Update Profile" },
    },
  }[tab];

  return (
    <div className="ios-empty-state col-span-full">
      <span className="material-symbols-outlined ios-empty-state-icon">{content.icon}</span>
      <h2 className="ios-empty-state-title">{content.title}</h2>
      <p className="ios-empty-state-body">{content.description}</p>
      <Link href={content.cta.href} className="ios-text-btn">
        {content.cta.label}
      </Link>
    </div>
  );
}

function ProfileCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
      {children}
    </div>
  );
}

export function DiscoverMatchesPage() {
  const { user, loading: authLoading, fetchUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DiscoverTab>("visited-you");
  const [profileVisitors, setProfileVisitors] = useState<VisitedProfile[]>([]);
  const [likedByYou, setLikedByYou] = useState<LikedProfile[]>([]);
  const [likesYou, setLikesYou] = useState<LikedProfile[]>([]);
  const [premiumVariant, setPremiumVariant] = useState<"likes" | "visitors">("likes");
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  const [premiumSheetOpen, setPremiumSheetOpen] = useState(false);
  const [likingBackId, setLikingBackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setError(null);

    try {
      const [visitorsData, likedData, likesData, plansData, walletData] = await Promise.all([
        api.getProfileVisitors(),
        api.getLikedByYou(),
        api.getLikesYou(),
        api.getSubscriptionPlans().catch(() => []),
        api.getWallet().catch(() => null),
      ]);
      setProfileVisitors(visitorsData.results);
      setLikedByYou(likedData);
      setLikesYou(likesData.results);
      setSubscriptionPlans(plansData);
      setWallet(walletData);
      setError(null);
    } catch {
      setError("Could not load your discover lists.");
      setProfileVisitors([]);
      setLikedByYou([]);
      setLikesYou([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handlePurchase = useCallback(async (planId: string) => {
    setPurchasing(true);
    setNotice(null);
    try {
      const result = await api.purchaseWithWallet(planId);
      setWallet((prev) =>
        prev
          ? { ...prev, balance: result.balance }
          : { balance: result.balance, currency: "NPR", top_up_presets: [500, 1000, 2000, 5000], transactions: [] }
      );
      setNotice("Pass purchased. Duo Premium is now active.");
      setPremiumSheetOpen(false);
      void fetchUser();
      void loadData(true);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not purchase pass. Please try again.");
    } finally {
      setPurchasing(false);
    }
  }, [fetchUser, loadData]);

  const handleTopUp = useCallback(async (amount: number) => {
    setToppingUp(true);
    setNotice(null);
    try {
      const payment = await api.initiateWalletTopUp(amount);
      submitEsewaPayment(payment.payment_url, payment.form);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Could not start eSewa top-up. Please try again."
      );
      setToppingUp(false);
    }
  }, []);

  const handleLikeBack = useCallback(
    async (item: LikedProfile) => {
      const toUserId = item.profile.user_id ?? item.profile.id;
      if (!toUserId) {
        setNotice("Could not like back — profile is missing a user id.");
        return;
      }

      const key = likedProfileKey(item);
      setLikingBackId(key);
      setNotice(null);

      try {
        const res = await api.swipe(toUserId, "LIKE");
        setLikesYou((prev) => prev.filter((entry) => likedProfileKey(entry) !== key));

        if (res.is_match && res.match) {
          sessionStorage.setItem("latest_match", JSON.stringify(res.match));
          router.push("/match/celebration");
          return;
        }

        setNotice("You liked them back!");
        void loadData(true);
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "Like back failed. Please try again.");
      } finally {
        setLikingBackId(null);
      }
    },
    [loadData, router]
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      void loadData();
    }
  }, [user, authLoading, router, loadData]);

  useEffect(() => {
    const subscriptionResult = searchParams.get("subscription");
    const walletResult = searchParams.get("wallet");
    const tab = searchParams.get("tab");

    if (tab === "likes-you") {
      setActiveTab("likes-you");
    } else if (tab === "visited-you") {
      setActiveTab("visited-you");
    }

    if (walletResult === "success") {
      setNotice("Wallet topped up successfully.");
      setActiveTab("likes-you");
      void fetchUser();
      void loadData(true);
      router.replace("/discover");
    } else if (walletResult === "failed") {
      setNotice("Top-up was not completed. You can try again with eSewa.");
      setActiveTab("likes-you");
      router.replace("/discover");
    } else if (subscriptionResult === "success") {
      setNotice("Payment successful. Duo Premium is now active.");
      setActiveTab("likes-you");
      void fetchUser();
      void loadData(true);
      router.replace("/discover");
    } else if (subscriptionResult === "failed") {
      setNotice("Payment was not completed. You can try again with eSewa.");
      setActiveTab("likes-you");
      router.replace("/discover");
    }
  }, [searchParams, fetchUser, loadData, router]);

  if (authLoading || loading) {
    return <DiscoverMatchesSkeleton />;
  }

  const tabCounts: Record<DiscoverTab, number> = {
    "visited-you": profileVisitors.length,
    "liked-by-you": likedByYou.length,
    "likes-you": likesYou.length,
  };

  const premiumCount =
    premiumVariant === "visitors" ? profileVisitors.length : likesYou.length;

  const openPremiumSheet = (variant: "likes" | "visitors") => {
    setPremiumVariant(variant);
    setPremiumSheetOpen(true);
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="ios-empty-state col-span-full">
          <span className="material-symbols-outlined ios-empty-state-icon">cloud_off</span>
          <h2 className="ios-empty-state-title">Unable to Load</h2>
          <p className="ios-empty-state-body">{error}</p>
          <button
            type="button"
            onClick={() => void loadData(true)}
            className="ios-text-btn"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (activeTab === "visited-you") {
      if (profileVisitors.length === 0) return <EmptyState tab="visited-you" />;
      return profileVisitors.map((item) => (
        <VisitedYouCard
          key={visitedProfileKey(item)}
          item={item}
          onLockedClick={() => openPremiumSheet("visitors")}
        />
      ));
    }

    if (activeTab === "liked-by-you") {
      if (likedByYou.length === 0) return <EmptyState tab="liked-by-you" />;
      return likedByYou.map((item) => (
        <LikedByYouCard key={likedProfileKey(item)} item={item} />
      ));
    }

    if (likesYou.length === 0) return <EmptyState tab="likes-you" />;
    return likesYou.map((item) => (
      <LikesYouCard
        key={likedProfileKey(item)}
        item={item}
        onLockedClick={() => openPremiumSheet("likes")}
        onLikeBack={(entry) => void handleLikeBack(entry)}
        likingBack={likingBackId === likedProfileKey(item)}
      />
    ));
  };

  return (
    <>
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <ChatSidebarNav />
        <main className="ios-page mobile-bottom-nav-offset flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto md:pb-10">
        <header className="ios-sticky-header top-0 md:top-0">
          <div className="mx-auto w-full max-w-lg px-4 md:max-w-7xl md:px-6 lg:px-8">
            <div className="md:hidden">
              <div className="ios-nav-bar">
                <button
                  type="button"
                  aria-label="Open menu"
                  onClick={() => setMenuOpen(true)}
                  className="ios-nav-btn -ml-2"
                >
                  <span className="material-symbols-outlined text-[26px]">line_weight</span>
                </button>
                <button
                  type="button"
                  aria-label="Refresh"
                  disabled={refreshing}
                  onClick={() => void loadData(true)}
                  className="ios-nav-btn -mr-2 disabled:opacity-40"
                >
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  >
                    refresh
                  </span>
                </button>
              </div>
            </div>

            <div className="hidden md:flex md:items-center md:justify-between md:gap-4 md:pb-4 md:pt-2">
              <h1 className="ios-large-title pb-0 pt-0 md:text-[2.5rem]">Discover</h1>
              <button
                type="button"
                aria-label="Refresh"
                disabled={refreshing}
                onClick={() => void loadData(true)}
                className="inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high disabled:opacity-40"
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    refreshing ? "animate-spin" : ""
                  }`}
                >
                  refresh
                </span>
                Refresh
              </button>
            </div>

            <h1 className="ios-large-title pb-3 pt-1 md:hidden">Discover</h1>

            <div className="ios-segmented pb-3 md:max-w-2xl lg:max-w-3xl">
              {TAB_CONFIG.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="ios-segmented-btn md:px-4 md:py-2.5 md:text-sm"
                >
                  {tab.label}
                  {tabCounts[tab.id] > 0 ? (
                    <span className="ml-0.5 tabular-nums opacity-75">{tabCounts[tab.id]}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-lg flex-1 px-4 pt-2 pb-4 md:max-w-7xl md:px-6 md:pt-4 lg:px-8">
          {notice ? (
            <div className="mb-4 rounded-xl border border-white/10 bg-surface-variant/50 px-4 py-3 text-sm text-on-surface">
              {notice}
            </div>
          ) : null}
          <ProfileCardGrid>{renderContent()}</ProfileCardGrid>
        </div>
      </main>
      </div>

      <BottomNav />

      <DashboardMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />

      <PremiumUpgradeSheet
        open={premiumSheetOpen}
        onClose={() => setPremiumSheetOpen(false)}
        plans={subscriptionPlans}
        count={premiumCount}
        variant={premiumVariant}
        walletBalance={wallet?.balance ?? user?.profile.wallet_balance ?? 0}
        topUpPresets={wallet?.top_up_presets ?? [500, 1000, 2000, 5000]}
        purchasing={purchasing}
        toppingUp={toppingUp}
        onPurchase={(planId) => void handlePurchase(planId)}
        onTopUp={(amount) => void handleTopUp(amount)}
      />
    </>
  );
}
