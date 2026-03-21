export interface UserRequest {
  users: Users[];
  total: number;
  grandTotal: number;
  page: number;
  totalPages: number;
}

export interface Users {
  id: number;
  username: string;
  email: string;
  password: string;
  role: "editor" | "admin" | "viewer";
}
