import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: {
      id: string;
      email: string;
      role: string;
      claims: {
        sub: string;
        email: string;
        first_name: string;
        last_name: string;
        role: string;
      };
    };
  }
}