import FilteredGirviListPage from "./FilteredGirviListPage";

export default function DueTodayGirvi() {
  return (
    <FilteredGirviListPage
      title="Due Today"
      subtitle="Girvi records maturing today"
      bannerTitle="Due Today Girvi"
      bannerSubtitle="Pending actions requiring follow-up today"
      apiPath="/girvi/due-today"
      emptyTitle="No Due Today Records"
      emptyMessage="No active Girvi records are due today."
      accent="purple"
    />
  );
}