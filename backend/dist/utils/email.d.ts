interface MailOptions {
    to: string;
    subject: string;
    html: string;
}
export declare function sendEmail(options: MailOptions): Promise<void>;
export declare function welcomeEmailTemplate(name: string): string;
export declare function passwordResetTemplate(name: string, resetUrl: string): string;
export declare function enrollmentConfirmTemplate(name: string, courseTitle: string): string;
export declare function verificationEmailTemplate(name: string, code: string): string;
export declare function instructorApprovedEmailTemplate(name: string): string;
export declare function instructorRejectedEmailTemplate(name: string, reason: string): string;
export {};
//# sourceMappingURL=email.d.ts.map