export class UnauthorizedError extends Error {
    public code?: string;
    constructor(code?: string) {
        super(code || 'Unauthorized');
        this.code = code;
        this.name = 'UnauthorizedError';
    }
}

export class APIError extends Error {
    public statusCode: number;
    public response?: any;

    constructor(message: string, statusCode: number, response?: any) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.response = response;
    }
}

export class TokenExpiredError extends Error {
    constructor() {
        super('Access token has expired');
        this.name = 'TokenExpiredError';
    }
}
