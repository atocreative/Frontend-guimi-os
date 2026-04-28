export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public originalError?: unknown,
    public data?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class NotFoundError extends ApiError {
  constructor(resourceType: string = "Recurso", originalError?: unknown) {
    super(
      404,
      "NOT_FOUND",
      `${resourceType} não encontrado ou você não tem permissão para acessá-lo.`,
      originalError
    )
  }
}

export class ForbiddenError extends ApiError {
  constructor(
    message = "Você não tem permissão para executar essa ação.",
    originalError?: unknown
  ) {
    super(403, "FORBIDDEN", message, originalError)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(
    message = "Sessão expirada. Faça login novamente.",
    originalError?: unknown
  ) {
    super(401, "UNAUTHORIZED", message, originalError)
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Dados inválidos.", originalError?: unknown, data?: unknown) {
    super(400, "VALIDATION_ERROR", message, originalError, data)
  }
}
