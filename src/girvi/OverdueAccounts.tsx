import FilteredGirviListPage from "./FilteredGirviListPage";

export default function OverdueAccounts() {
  return (
    <FilteredGirviListPage
      title="Overdue Accounts"
      subtitle="Girvi records past maturity date"
      bannerTitle="Overdue Accounts"
      bannerSubtitle="Immediate collection follow-up required"
      apiPath="/girvi/overdue"
      emptyTitle="No Overdue Accounts"
      emptyMessage="No active Girvi records are overdue."
      accent="purple"
    />
  );
}