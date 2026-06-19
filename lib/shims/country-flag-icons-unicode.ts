function getRegionalIndicatorSymbol(letter: string) {
  return String.fromCodePoint(letter.toUpperCase().charCodeAt(0) + 127397);
}

export default function getUnicodeFlagIcon(country: string) {
  return getRegionalIndicatorSymbol(country[0]) + getRegionalIndicatorSymbol(country[1]);
}
