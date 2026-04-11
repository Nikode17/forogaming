import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-gray-800 bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Respawn" className="h-7 w-auto opacity-70" />
            <span className="text-sm text-gray-500">
              © {year} Respawn. Todos los derechos reservados.
            </span>
          </div>

          {/* Legal links */}
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <Link href="/terminos" className="hover:text-gray-300 transition-colors">
              Términos de uso
            </Link>
            <Link href="/privacidad" className="hover:text-gray-300 transition-colors">
              Política de privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
