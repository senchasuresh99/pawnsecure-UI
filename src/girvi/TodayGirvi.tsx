import FilteredGirviListPage from "./FilteredGirviListPage";

export default function TodayGirvi() {
  return (
    <FilteredGirviListPage
      title="Today's Girvi"
      subtitle="Girvi records created today"
      bannerTitle="Today's Girvi"
      bannerSubtitle="All pledge records created today"
      apiPath="/girvi/today"
      emptyTitle="No Girvi Created Today"
      emptyMessage="No Girvi records were created today."
      accent="purple"
    />
  );
}