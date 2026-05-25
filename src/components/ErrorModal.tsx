function ErrorModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="text-purple-600 text-5xl mb-3">✖</div>

        <h2 className="text-xl font-bold mb-2">Error</h2>

        <p className="text-gray-600 mb-5">{message}</p>

        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          OK
        </button>
      </div>
    </div>
  );
}