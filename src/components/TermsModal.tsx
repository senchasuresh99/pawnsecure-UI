type TermsModalProps = {
  onClose: () => void;
};

export default function TermsModal({ onClose }: TermsModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Terms & Conditions
        </h2>

        <div className="text-sm text-gray-600 space-y-3 max-h-[300px] overflow-y-auto pr-2">
          <p>
            Welcome to <strong>PawnSecure</strong>. By accessing or using this
            platform, you agree to comply with and be bound by the following
            Terms & Conditions.
          </p>

          <ol className="list-decimal pl-4 space-y-2">
            <li>
              Dealers are solely responsible for ensuring that all customer
              information submitted on this platform is accurate, lawful, and
              collected with proper customer consent.
            </li>
            <li>
              PawnSecure operates solely as a secure dealer verification and
              record‑management platform and does not guarantee the
              authenticity, accuracy, or completeness of user‑submitted
              information.
            </li>
            <li>
              Customer Aadhaar or identity information must be used strictly for
              lawful verification purposes and in accordance with applicable
              laws and regulations.
            </li>
            <li>
              Unauthorized access, misuse, fake reviews, fraud, record
              manipulation, or illegal platform usage may result in suspension,
              termination, or legal action.
            </li>
            <li>
              Dealers are prohibited from uploading false, misleading,
              offensive, illegal, or unauthorized customer information.
            </li>
            <li>
              PawnSecure reserves the right to monitor, review, suspend,
              restrict, or remove accounts or content that violate platform
              policies or laws.
            </li>
            <li>
              PawnSecure is a subscription‑based service and requires an active
              paid subscription for full access.
            </li>
            <li>
              Dealer accounts operate on a yearly subscription model from the
              date of activation.
            </li>
            <li>
              Subscription renewal is required to continue platform access after
              the subscription period expires.
            </li>
          </ol>

          <p>
            <strong>
              Failure to renew may result in restricted access or account
              deactivation.
            </strong>
          </p>

          <ol className="list-decimal pl-4 space-y-2">
            <li>
              Subscription fees are non‑refundable unless explicitly stated
              otherwise.
            </li>
            <li>
              PawnSecure may modify pricing, plans, features, or service
              availability at any time without prior notice.
            </li>
            <li>
              PawnSecure is not responsible for losses, disputes, damages, fraud
              claims, or legal issues arising from dealer‑submitted data or
              transactions.
            </li>
            <li>
              Dealers are responsible for maintaining the security and
              confidentiality of their login credentials.
            </li>
            <li>
              Services may be temporarily suspended for maintenance, upgrades,
              or operational improvements.
            </li>
            <li>
              Platform usage must comply with all applicable local, state, and
              national laws.
            </li>
            <li>
              Continued use of the platform confirms acceptance of these Terms &
              Conditions.
            </li>
            <li>
              PawnSecure reserves the right to update these Terms & Conditions
              at any time. Continued usage constitutes acceptance of updates.
            </li>
          </ol>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Close
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}