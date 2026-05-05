export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    FRONTEND_URL: string;
    DATABASE_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_S3_BUCKET_NAME: string;
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;
    EMAIL_FROM: string;
    AWS_S3_ENDPOINT?: string | undefined;
};
export type Env = typeof env;
//# sourceMappingURL=env.d.ts.map