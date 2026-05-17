import { Request, Response } from 'express';
export declare const checkDeviceTrust: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const sendDeviceTrustOtp: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const verifyDeviceTrustOtp: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updatePhone: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const initSmsVerify: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const smsVerifyStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const smsWebhook: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=deviceTrust.controller.d.ts.map