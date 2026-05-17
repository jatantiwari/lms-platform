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
/**
 * Sent to the student immediately after registration — contains login credentials.
 */
export declare function seoStudentCredentialsTemplate(name: string, email: string, password: string, plan: string, loginUrl: string): string;
/**
 * Sent to the instructor when a new student registers.
 */
export declare function seoInstructorNotificationTemplate(instructorName: string, student: {
    name: string;
    email: string;
    mobile: string;
    plan: string;
    occupation: string;
    experience: string;
    whyJoin: string;
}, dashboardUrl: string): string;
/**
 * Sent to the student after successful payment confirmation.
 */
export declare function seoPaymentConfirmedTemplate(name: string, plan: string, amount: number, paymentId: string): string;
/**
 * Sent to the student when the instructor manually enrolls them into a course.
 */
export declare function seoEnrollmentConfirmTemplate(name: string, courseTitle: string, loginUrl: string): string;
export declare function seoLeadStudentAckTemplate(name: string): string;
export declare function seoLeadInstructorTemplate(instructorName: string, lead: {
    fullName: string;
    email: string;
    phone?: string;
    message: string;
}): string;
export {};
//# sourceMappingURL=email.d.ts.map