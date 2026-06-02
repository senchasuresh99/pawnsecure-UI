import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/* ---------------- TYPES ---------------- */

type Customer = {
  id?: number | string;
  customerId?: number | string;
  customer_id?: number | string;
  name?: string;
  fullName?: string;
  customerName?: string;
  phone?: string;
  phoneNumber?: string;
  mobile?: string;
  aadhaar?: string;
  maskedAadhaar?: string;
  dob?: string;
  gender?: string;
  address?: string;
  [key: string]: any;
};

type LoanDetails = {
  customerId: number | string | null;
  amount: string;
  interestRate: string;
  interestType: string;
  pledgeDate: string;
  maturityDate: string;
};

type GirviItem = {
  name: string;
  weight: string;
  purity: string;
  desc: string;
};

type LockerDetails = {
  packetNo: string;
  lockerNo: string;
  shelf: string;
  box: string;
  processingFee: string;
  otherCharges: string;
};

type GirviState = {
  customer: Customer | null;
  loanDetails: LoanDetails;
  items: GirviItem[];
  locker: LockerDetails;
};

type GirviContextType = {
  customer: Customer | null;
  setCustomer: (value: Customer | null) => void;

  loanDetails: LoanDetails;
  setLoanDetails: (
    data: Partial<LoanDetails> | ((prev: LoanDetails) => LoanDetails)
  ) => void;

  items: GirviItem[];
  setItems: (
    data: GirviItem[] | ((prev: GirviItem[]) => GirviItem[])
  ) => void;

  locker: LockerDetails;
  setLocker: (
    data: Partial<LockerDetails> | ((prev: LockerDetails) => LockerDetails)
  ) => void;

  resetGirvi: () => void;
};

/* ---------------- CONTEXT ---------------- */

const GirviContext = createContext<GirviContextType | null>(null);

const STORAGE_KEY = "ps_girvi_context";
const CUSTOMER_ID_KEY = "ps_customer_id";
const SELECTED_CUSTOMER_KEY = "ps_selected_customer";

/* ---------------- INITIAL STATE ---------------- */

const initialLoanDetails: LoanDetails = {
  customerId: null,
  amount: "",
  interestRate: "",
  interestType: "Monthly",
  pledgeDate: "",
  maturityDate: "",
};

const initialLockerDetails: LockerDetails = {
  packetNo: "",
  lockerNo: "",
  shelf: "",
  box: "",
  processingFee: "",
  otherCharges: "",
};

const initialState: GirviState = {
  customer: null,
  loanDetails: initialLoanDetails,
  items: [],
  locker: initialLockerDetails,
};

/* ---------------- HELPERS ---------------- */

function getCustomerId(customer: Customer | null | undefined) {
  if (!customer) return null;

  return (
    customer.id ||
    customer.customerId ||
    customer.customer_id ||
    customer.customer?.id ||
    customer.customer?.customerId ||
    null
  );
}

function loadInitialState(): GirviState {
  try {
    const savedContext = localStorage.getItem(STORAGE_KEY);
    const savedCustomerId = localStorage.getItem(CUSTOMER_ID_KEY);
    const savedCustomer = localStorage.getItem(SELECTED_CUSTOMER_KEY);

    if (savedContext) {
      const parsed = JSON.parse(savedContext) as GirviState;

      return {
        ...initialState,
        ...parsed,
        loanDetails: {
          ...initialLoanDetails,
          ...(parsed.loanDetails || {}),
          customerId:
            parsed.loanDetails?.customerId ||
            getCustomerId(parsed.customer) ||
            savedCustomerId ||
            null,
        },
      };
    }

    if (savedCustomerId || savedCustomer) {
      const parsedCustomer = savedCustomer
        ? (JSON.parse(savedCustomer) as Customer)
        : null;

      return {
        ...initialState,
        customer: parsedCustomer,
        loanDetails: {
          ...initialLoanDetails,
          customerId: savedCustomerId || getCustomerId(parsedCustomer),
        },
      };
    }

    return initialState;
  } catch {
    return initialState;
  }
}

/* ---------------- PROVIDER ---------------- */

export function GirviProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GirviState>(() => loadInitialState());

  /* ✅ Persist full girvi context */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    const customerId =
      state.loanDetails.customerId || getCustomerId(state.customer);

    if (customerId) {
      localStorage.setItem(CUSTOMER_ID_KEY, String(customerId));
    }

    if (state.customer) {
      localStorage.setItem(
        SELECTED_CUSTOMER_KEY,
        JSON.stringify(state.customer)
      );
    }
  }, [state]);

  /* ---------------- SAFE SETTERS ---------------- */

  function setCustomer(customer: Customer | null) {
    setState((prev) => {
      if (!customer) {
        localStorage.removeItem(CUSTOMER_ID_KEY);
        localStorage.removeItem(SELECTED_CUSTOMER_KEY);

        return {
          ...prev,
          customer: null,
          loanDetails: {
            ...prev.loanDetails,
            customerId: null,
          },
        };
      }

      const customerId = getCustomerId(customer);

      const normalizedCustomer: Customer = {
        ...customer,
        id: customerId || customer.id,
        customerId: customerId || customer.customerId,
      };

      if (customerId) {
        localStorage.setItem(CUSTOMER_ID_KEY, String(customerId));
      }

      localStorage.setItem(
        SELECTED_CUSTOMER_KEY,
        JSON.stringify(normalizedCustomer)
      );

      return {
        ...prev,
        customer: normalizedCustomer,
        loanDetails: {
          ...prev.loanDetails,
          customerId: customerId || prev.loanDetails.customerId,
        },
      };
    });
  }

  function setLoanDetails(
    data: Partial<LoanDetails> | ((prev: LoanDetails) => LoanDetails)
  ) {
    setState((prev) => ({
      ...prev,
      loanDetails:
        typeof data === "function"
          ? data(prev.loanDetails)
          : { ...prev.loanDetails, ...data },
    }));
  }

  function setItems(
    data: GirviItem[] | ((prev: GirviItem[]) => GirviItem[])
  ) {
    setState((prev) => ({
      ...prev,
      items: typeof data === "function" ? data(prev.items) : data,
    }));
  }

  function setLocker(
    data: Partial<LockerDetails> | ((prev: LockerDetails) => LockerDetails)
  ) {
    setState((prev) => ({
      ...prev,
      locker:
        typeof data === "function"
          ? data(prev.locker)
          : { ...prev.locker, ...data },
    }));
  }

  function resetGirvi() {
    setState(initialState);

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOMER_ID_KEY);
    localStorage.removeItem(SELECTED_CUSTOMER_KEY);
  }

  return (
    <GirviContext.Provider
      value={{
        customer: state.customer,
        setCustomer,

        loanDetails: state.loanDetails,
        setLoanDetails,

        items: state.items,
        setItems,

        locker: state.locker,
        setLocker,

        resetGirvi,
      }}
    >
      {children}
    </GirviContext.Provider>
  );
}

/* ---------------- HOOK ---------------- */

export function useGirvi() {
  const ctx = useContext(GirviContext);

  if (!ctx) {
    throw new Error("useGirvi must be used inside GirviProvider");
  }

  return ctx;
}
