import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

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
  customerId: string | number;
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

type GirviContextType = {
  customer: Customer | null;
  setCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;

  loanDetails: LoanDetails;
  setLoanDetails: React.Dispatch<React.SetStateAction<LoanDetails>>;

  items: GirviItem[];
  setItems: React.Dispatch<React.SetStateAction<GirviItem[]>>;

  locker: LockerDetails;
  setLocker: React.Dispatch<React.SetStateAction<LockerDetails>>;

  resetGirvi: () => void;
};

const GirviContext = createContext<GirviContextType | null>(null);

const initialLoanDetails: LoanDetails = {
  customerId: "",
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

export function GirviProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [loanDetails, setLoanDetails] =
    useState<LoanDetails>(initialLoanDetails);

  const [items, setItems] = useState<GirviItem[]>([]);

  const [locker, setLocker] =
    useState<LockerDetails>(initialLockerDetails);

  function resetGirvi() {
    setCustomer(null);
    setLoanDetails(initialLoanDetails);
    setItems([]);
    setLocker(initialLockerDetails);
  }

  return (
    <GirviContext.Provider
      value={{
        customer,
        setCustomer,

        loanDetails,
        setLoanDetails,

        items,
        setItems,

        locker,
        setLocker,

        resetGirvi,
      }}
    >
      {children}
    </GirviContext.Provider>
  );
}

export function useGirvi() {
  const context = useContext(GirviContext);

  if (!context) {
    throw new Error("useGirvi must be used inside GirviProvider");
  }

  return context;
}