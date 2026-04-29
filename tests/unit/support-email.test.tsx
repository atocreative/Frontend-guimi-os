import { fireEvent, render, screen } from "@testing-library/react"
import { EmailForm } from "@/components/support/email-form"

describe("support email form", () => {
  const originalOpen = window.open

  beforeEach(() => {
    window.open = jest.fn()
  })

  afterEach(() => {
    window.open = originalOpen
  })

  it("renders support destination", () => {
    render(<EmailForm />)

    expect(screen.getByText(/suporte@guimicell.com.br/i)).toBeInTheDocument()
  })

  it("shows validation errors when submitting empty fields", async () => {
    render(<EmailForm />)

    fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument()
    expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
  })

  it("opens the mail client with filled data", async () => {
    render(<EmailForm />)

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "Caio" } })
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "caio@example.com" } })
    fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Preciso de ajuda" } })
    fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: "Mensagem de suporte com detalhes suficientes." } })

    fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

    expect(await screen.findByText(/cliente de e-mail foi acionado/i)).toBeInTheDocument()
    expect(window.open).toHaveBeenCalled()
  })
})
