export const metadata = {
  title: 'Términos de uso — Respawn',
}

export default function TerminosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-100 mb-2">Términos de uso</h1>
      <p className="text-sm text-gray-500 mb-8">Última actualización: abril de 2026</p>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">1. Aceptación de los términos</h2>
          <p>Al acceder y usar Respawn aceptas estos términos de uso. Si no estás de acuerdo, no uses la plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">2. Descripción del servicio</h2>
          <p>Respawn es una comunidad de videojuegos donde los usuarios pueden publicar guías, easter eggs, reviews y participar en discusiones relacionadas con videojuegos.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">3. Cuentas de usuario</h2>
          <p>Eres responsable de mantener la confidencialidad de tu contraseña y de toda la actividad que ocurra bajo tu cuenta. Debes notificarnos inmediatamente si detectas un uso no autorizado.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">4. Contenido del usuario</h2>
          <p>El contenido que publicas es tuyo. Al publicarlo en Respawn nos otorgas una licencia no exclusiva para mostrarlo en la plataforma. No publicarás contenido que sea:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Ilegal, ofensivo, discriminatorio o que incite al odio</li>
            <li>Spam o publicidad no solicitada</li>
            <li>Material con derechos de autor sin permiso del titular</li>
            <li>Información personal de terceros sin su consentimiento</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">5. Moderación</h2>
          <p>Nos reservamos el derecho de eliminar contenido o suspender cuentas que incumplan estas normas, sin previo aviso.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">6. Limitación de responsabilidad</h2>
          <p>Respawn no se hace responsable del contenido publicado por los usuarios. La plataforma se ofrece "tal cual", sin garantías de disponibilidad continua.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">7. Cambios en los términos</h2>
          <p>Podemos actualizar estos términos en cualquier momento. El uso continuado de la plataforma tras los cambios implica la aceptación de los nuevos términos.</p>
        </section>

      </div>
    </div>
  )
}
