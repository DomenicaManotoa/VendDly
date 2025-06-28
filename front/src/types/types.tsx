export interface AuthFormProps {
  isLogin: boolean;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

export interface User {
  email: string;
  password: string;
  name?: string;
}