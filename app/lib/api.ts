export type PublicUser = {
  id: string;
  role: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  email_verified: boolean;
};

export type Session = {
  token: string;
  user: PublicUser;
};

const sessionKey = "virungapay.session";
const adminSessionKey = "virungapay.admin.session";

export function saveSession(session: Session, audience: "operator" | "admin" = "operator") {
  localStorage.setItem(audience === "admin" ? adminSessionKey : sessionKey, JSON.stringify(session));
}

export type Wallet = {
  id: string;
  kind?: string;
  name?: string;
  currency: string;
  balance: string;
  is_default: boolean;
  username?: string;
};

export type Company = {
  id: string;
  name: string;
  country: string;
  association_member_of?: string;
  status: "pending" | "approved" | "disabled";
  wallets: Wallet[];
};

export type Business = {
  id: string;
  name: string;
  country: string;
  association_member_of?: string;
  status: "pending" | "approved" | "disabled";
  owner_name: string;
  owner_email: string;
  wallets: Wallet[];
};

export type FeeSchedule = {
  kind: string;
  currency: string;
  flat: string;
  markup_bps: number;
};

export type Tariff = {
  pair: string;
  quote_on: string;
  integrator_rate: string;
  markup_bps: number;
  customer_rate: string;
};

export function readSession(): { session: Session; audience: "operator" | "admin" } | null {
  const operator = readStored(sessionKey);
  if (operator) return { session: operator, audience: "operator" };
  const admin = readStored(adminSessionKey);
  if (admin) return { session: admin, audience: "admin" };
  return null;
}

export function readAdminSession(): Session | null {
  return readStored(adminSessionKey);
}

export function clearSession() {
  localStorage.removeItem(sessionKey);
  localStorage.removeItem(adminSessionKey);
}

function readStored(key: string): Session | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    if (!session.token || !session.user?.email) return null;
    return session;
  } catch {
    return null;
  }
}

export function currentUser() {
  const saved = readSession();
  if (!saved) return Promise.reject(new ApiError("Sign in again.", "unauthorized"));
  const path = saved.audience === "admin" ? "/admin/v1/me" : "/v1/me";
  return get<PublicUser>(path, saved.session.token);
}

export class ApiError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export function actionNotice(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "insufficient_balance":
        return "This wallet does not have enough for that amount.";
      case "fee_too_large":
        return "The fee is larger than the amount.";
      case "fee_not_set":
        return "No fee has been set for this payment.";
      case "rate_not_set":
        return "No exchange rate has been set.";
      case "wallet_not_found":
        return "That wallet was not found.";
      case "not_ready":
        return "A wallet needed for this payment is not set up yet.";
      case "business_not_approved":
        return "Approve the business before money can move.";
      default:
        return error.message || "Something went wrong. Try again.";
    }
  }
  return error instanceof Error && error.message ? error.message : "Something went wrong. Try again.";
}

export async function login(email: string, password: string) {
  const session = await post<Session>("/v1/auth/login", { email, password });
  return { session, audience: "operator" as const };
}

export function adminLogin(email: string, password: string) {
  return post<Session>("/admin/v1/auth/login", { email, password });
}

export function registerOperator(input: { firstName: string; lastName: string; email: string; phone?: string; password: string }) {
  return post<{ user: PublicUser }>("/v1/operators", {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    password: input.password,
    ...(input.phone ? { phone: input.phone } : {}),
  });
}

export function forgotPassword(email: string) {
  return post<{ message: string }>("/v1/auth/forgot-password", { email });
}

export function adminForgotPassword(email: string) {
  return post<{ message: string }>("/admin/v1/auth/forgot-password", { email });
}

function operatorToken() {
  const saved = readSession();
  if (!saved || saved.audience !== "operator") throw new ApiError("Sign in again.", "unauthorized");
  return saved.session.token;
}

function adminToken() {
  const session = readAdminSession();
  if (!session?.token) throw new ApiError("Sign in again.", "unauthorized");
  return session.token;
}

export function myCompany() {
  return get<Company>("/v1/companies/mine", operatorToken());
}

export async function downloadStatement(walletId: string, filename: string) {
  const response = await fetch(`/v1/wallets/${walletId}/statement?format=pdf`, {
    headers: { authorization: `Bearer ${operatorToken()}` },
  });
  if (!response.ok) {
    let message = "The statement could not be generated.";
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // keep the fallback
    }
    throw new ApiError(message, "statement_failed");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export type CrewMember = {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  wallet_currency: string;
  wallet_balance: string;
  username?: string;
};

export function listCrew() {
  return get<{ crew: CrewMember[] }>("/v1/companies/crew", operatorToken());
}

export function inviteCrew(input: { name: string; email: string; phone?: string; role: "guide" | "driver" }) {
  return send<{ user_id: string; email: string; role: string; status: string }>("/v1/companies/invites", "POST", operatorToken(), {
    name: input.name,
    email: input.email,
    role: input.role,
    ...(input.phone ? { phone: input.phone } : {}),
  });
}

export function moveWallets(fromWalletId: string, toWalletId: string, amount: string) {
  return send<Company>("/v1/wallets/moves", "POST", operatorToken(), {
    from_wallet_id: fromWalletId,
    to_wallet_id: toWalletId,
    amount,
  });
}

export function renameWallet(id: string, input: { name: string; username: string }) {
  return send<Wallet>(`/v1/wallets/${id}`, "PATCH", operatorToken(), input);
}

export function createCompany(input: { name: string; country: string; association: string }) {
  return send<Company>("/v1/companies", "POST", operatorToken(), {
    name: input.name,
    country: input.country,
    ...(input.association ? { association: input.association } : {}),
  });
}

export function todayTariff() {
  return get<{ tariffs: Tariff[] }>("/v1/tariff", operatorToken());
}

export type TripDay = { day_number: number; title: string; body: string };

export type TripPackage = {
  id: string;
  title: string;
  summary: string;
  status: "draft" | "published";
  days: TripDay[];
  inclusions: string[];
  exclusions: string[];
  notes: string[];
};

export type Inquiry = {
  id: string;
  customer_name: string;
  customer_email: string;
  starts_on: string;
  ends_on: string;
  party_size: number;
  notes: string;
  created_at: string;
};

export type Itinerary = {
  id: string;
  package_id?: string;
  inquiry_id?: string;
  customer_name: string;
  customer_email: string;
  starts_on: string;
  ends_on: string;
  party_size: number;
  title: string;
  summary: string;
  currency: string;
  amount_due: string;
  invoice_number?: string;
  status: "draft" | "sent" | "paid";
  tourist_user_id?: string;
  business_name?: string;
  days: TripDay[];
  inclusions: string[];
  exclusions: string[];
  notes: string[];
  paid_at?: string;
};

export type PlatformTransaction = {
  id: string;
  kind: string;
  currency: string;
  gross: string;
  fee: string;
  net: string;
  from_name: string;
  to_name: string;
  invoice_number?: string;
  quote_currency?: string;
  quote_amount?: string;
  created_at: string;
};

export type OperatorPayment = {
  id: string;
  kind: string;
  direction: "in" | "out";
  amount: string;
  currency: string;
  invoice_number?: string;
  counterparty?: string;
  created_at: string;
};

export type TouristAccount = {
  id: string;
  name: string;
  email: string;
  username?: string;
};

export function listTourists() {
  return get<{ tourists: TouristAccount[] }>("/v1/tourists", operatorToken());
}

export function listPackages() {
  return get<{ packages: TripPackage[] }>("/v1/packages", operatorToken());
}

export function savePackage(pkg: TripPackage) {
  if (pkg.id) return send<TripPackage>(`/v1/packages/${pkg.id}`, "PUT", operatorToken(), pkg);
  return send<TripPackage>("/v1/packages", "POST", operatorToken(), pkg);
}

export function listInquiries() {
  return get<{ inquiries: Inquiry[] }>("/v1/inquiries", operatorToken());
}

export function createInquiry(inquiry: Omit<Inquiry, "id" | "created_at">) {
  return send<Inquiry>("/v1/inquiries", "POST", operatorToken(), inquiry);
}

export function listItineraries() {
  return get<{ itineraries: Itinerary[] }>("/v1/itineraries", operatorToken());
}

export function getItinerary(id: string) {
  return get<Itinerary>(`/v1/itineraries/${id}`, operatorToken());
}

export function saveItinerary(item: Partial<Itinerary> & { title?: string }) {
  if (item.id) return send<Itinerary>(`/v1/itineraries/${item.id}`, "PUT", operatorToken(), item);
  return send<Itinerary>("/v1/itineraries", "POST", operatorToken(), item);
}

export function sendItinerary(id: string) {
  return send<Itinerary>(`/v1/itineraries/${id}/send`, "POST", operatorToken(), {});
}

export function assignItinerary(id: string, touristId: string) {
  return send<Itinerary>(`/v1/itineraries/${id}/assign`, "POST", operatorToken(), { tourist_id: touristId });
}

export function loadPayPage(token: string) {
  return getPublic(token);
}

async function getPublic(token: string) {
  const response = await fetch(`/v1/pay/${token}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw await errorMessage(response);
  return response.json() as Promise<Itinerary>;
}

export function payItinerary(token: string) {
  return post<Itinerary>(`/v1/pay/${token}`, {});
}

export function listOperatorPayments() {
  return get<{ payments: OperatorPayment[] }>("/v1/transactions", operatorToken());
}

export function listTransactions() {
  return get<{ transactions: PlatformTransaction[] }>("/admin/v1/transactions", adminToken());
}

export type PersonWallet = {
  id: string;
  kind: string;
  name: string;
  username?: string;
  currency: string;
  balance: string;
  holder_name: string;
  holder_email: string;
  holder_role: string;
  holder_status: string;
};

export function listPersonWallets() {
  return get<{ wallets: PersonWallet[] }>("/admin/v1/person-wallets", adminToken());
}

export function listBusinesses() {
  return get<{ businesses: Business[] }>("/admin/v1/businesses", adminToken());
}

export function approveBusiness(id: string) {
  return send<Business>(`/admin/v1/businesses/${id}/approve`, "POST", adminToken(), {});
}

export function disableBusiness(id: string) {
  return send<Business>(`/admin/v1/businesses/${id}/disable`, "POST", adminToken(), {});
}

export function openWallet(id: string, currency: "USD") {
  return send<Business>(`/admin/v1/businesses/${id}/wallets`, "POST", adminToken(), { currency });
}

export function openUsdWallet(id: string) {
  return openWallet(id, "USD");
}

export function setDefaultWallet(businessId: string, walletId: string) {
  return send<Business>(`/admin/v1/businesses/${businessId}/wallets/${walletId}/default`, "POST", adminToken(), {});
}

export function staffTariff() {
  return get<{ tariffs: Tariff[] }>("/admin/v1/tariff", adminToken());
}

export function saveTariff(pair: string, integratorRate: string, markupBps: number) {
  return send<Tariff>("/admin/v1/tariff", "PUT", adminToken(), {
    pair,
    integrator_rate: integratorRate,
    markup_bps: markupBps,
  });
}

export function listBureaus() {
  return get<{ businesses: Business[] }>("/admin/v1/bureaus", adminToken());
}

export function addBureau(input: { name: string; country: string; owner: string; email: string; phone: string }) {
  return send<Business>("/admin/v1/bureaus", "POST", adminToken(), input);
}

export function listFees() {
  return get<{ fees: FeeSchedule[] }>("/admin/v1/fees", adminToken());
}

export function saveFee(schedule: FeeSchedule) {
  return send<FeeSchedule>("/admin/v1/fees", "PUT", adminToken(), schedule);
}

export function listPlatformWallets() {
  return get<{ wallets: Wallet[] }>("/admin/v1/platform-wallets", adminToken());
}

export type StatementLine = {
  id: string;
  kind: string;
  direction: "in" | "out";
  amount: string;
  currency: string;
  running_balance: string;
  created_at: string;
};

export function platformStatement(walletId: string) {
  return get<{ wallet: Wallet; movements: StatementLine[] }>(`/admin/v1/platform-wallets/${walletId}/statement`, adminToken());
}

async function get<T>(path: string, token: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("Could not reach VirungaPay. Check that the API is running.");
  }
  if (!response.ok) throw await errorMessage(response);
  return response.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return send<T>(path, "POST", "", body);
}

async function send<T>(path: string, method: string, token: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach VirungaPay. Check that the API is running.");
  }
  if (!response.ok) throw await errorMessage(response);
  return response.json() as Promise<T>;
}

async function errorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    if (body.error?.message) return new ApiError(body.error.message, body.error.code ?? "request_failed");
  } catch {
    // The API sometimes returns an empty or non-JSON failure body.
  }
  return new ApiError("Something went wrong. Try again.", "request_failed");
}
