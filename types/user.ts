export type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    bio: string;
    loginType?: 'email' | 'google';
    createdAt: string ;
    updatedAt: string ;
}