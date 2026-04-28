import { z } from "zod"

const optionalNullableString = z.union([z.string(), z.null()]).optional()
const optionalNullableDateInput = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    z.null(),
  ])
  .optional()
const optionalNullableTimeInput = z
  .union([
    z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:MM inválido"),
    z.null(),
  ])
  .optional()
const optionalNullableUuid = z.union([z.string().uuid("Identificador inválido"), z.null()]).optional()

export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
})

export const mfaVerifySchema = z.object({
  challengeToken: z.string().min(1, "Sessão de verificação inválida"),
  code: z.string().regex(/^\d{6}$/, "Código deve ter 6 dígitos"),
})

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(255, "Título muito longo"),
  description: optionalNullableString,
  priority: z.enum(["ALTA", "MEDIA", "BAIXA"]).nullable().optional(),
  dueAt: optionalNullableDateInput,
  horario: optionalNullableTimeInput,
  assigneeId: optionalNullableUuid,
})

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(255, "Título muito longo").optional(),
  description: optionalNullableString,
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]).optional(),
  priority: z.enum(["ALTA", "MEDIA", "BAIXA"]).nullable().optional(),
  dueAt: optionalNullableDateInput,
  horario: optionalNullableTimeInput,
  assigneeId: optionalNullableUuid,
})

export const taskFiltersSchema = z.object({
  assigneeId: z.string().uuid("Filtro de responsável inválido").optional(),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]).optional(),
  orderBy: z.enum(["createdAt", "dueAt", "priority", "title"]).optional(),
  sort: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export const userCreateSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(255, "Nome muito longo"),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  jobTitle: z.string().trim().min(1, "Cargo obrigatório").max(255, "Cargo muito longo"),
  role: z.enum(["COLABORADOR", "GESTOR"]),
})

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  email: z.string().trim().email().optional(),
  jobTitle: z.string().trim().min(1).max(255).optional(),
})

export const supportEmailSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(255),
  email: z.string().trim().email("Email inválido"),
  subject: z.string().trim().min(1, "Assunto é obrigatório").max(255),
  message: z.string().trim().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(5000),
})
