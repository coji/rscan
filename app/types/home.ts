export interface Receipt {
  id: string;
  image: string;
  date: string;
  amount: string;
  store: string;
  category: string;
  timestamp: string;
}

export type Route = {
  ActionArgs: {
    request: Request;
  };
  LoaderData: {
    receipts: Receipt[];
  };
  ActionData: {
    success: boolean;
    receipt?: Receipt;
    error?: string;
    csvContent?: string;
  };
};
