export interface UserRequest {
  users: Users[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

export interface Users {
  id: string;
  username: string;
  email: string;
  role: "editor" | "admin" | "viewer";
}
