export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-indigo-800 via-purple-700 to-blue-800 text-indigo-100">
      <div className="max-w-5xl mx-auto px-4 py-6 text-center">
        <div className="flex justify-center gap-4 text-xs mb-2">
          <span className="hover:text-white cursor-pointer">
            Terms & Conditions
          </span>
          <span className="opacity-40">|</span>
          <span className="hover:text-white cursor-pointer">
            Privacy Policy
          </span>
        </div>

        <p className="text-[11px]">
          © {new Date().getFullYear()} PawnSecure. All rights reserved.
        </p>

        <p className="text-[10px] text-indigo-300 mt-1">
          Trusted Records • Secure Connections
        </p>
      </div>
    </footer>
  );
}