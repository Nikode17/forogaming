export const metadata = {
  title: 'Política de privacidad — Respawn',
}

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-100 mb-2">Política de privacidad</h1>
      <p className="text-sm text-gray-500 mb-8">Última actualización: abril de 2026</p>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">1. Responsable del tratamiento</h2>
          <p>Respawn es el responsable del tratamiento de los datos personales recogidos a través de esta plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">2. Datos que recogemos</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-gray-200">Datos de registro:</strong> nombre de usuario y dirección de email.</li>
            <li><strong className="text-gray-200">Contenido generado:</strong> posts, comentarios y mensajes directos que publicas.</li>
            <li><strong className="text-gray-200">Datos de uso:</strong> fecha de registro y última actividad.</li>
            <li><strong className="text-gray-200">Archivos subidos:</strong> avatar e imágenes de posts, almacenados en Uploadthing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">3. Finalidad del tratamiento</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Gestionar tu cuenta y autenticación</li>
            <li>Mostrar tu perfil y contenido publicado a otros usuarios</li>
            <li>Enviar mensajes directos entre usuarios</li>
            <li>Moderar el contenido de la plataforma</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">4. Base legal</h2>
          <p>El tratamiento se basa en el consentimiento que otorgas al registrarte y en el interés legítimo de mantener la seguridad y correcto funcionamiento de la plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">5. Almacenamiento y seguridad</h2>
          <p>Los datos se almacenan en servidores de Neon (PostgreSQL serverless) con cifrado en reposo. Las contraseñas se guardan hasheadas con bcrypt y nunca en texto plano. La comunicación se realiza siempre bajo HTTPS.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">6. Tus derechos (RGPD)</h2>
          <p>Tienes derecho a acceder, rectificar y suprimir tus datos. Para ejercerlos, elimina tu cuenta desde los ajustes o contacta con los administradores de la plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">7. Cookies</h2>
          <p>Usamos únicamente una cookie técnica (<code className="text-indigo-400">refresh_token</code>, httpOnly) necesaria para mantener tu sesión iniciada. No usamos cookies de seguimiento ni publicidad.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-100 mb-2">8. Cambios en la política</h2>
          <p>Notificaremos cualquier cambio relevante en esta política. El uso continuado de la plataforma implica la aceptación de la versión vigente.</p>
        </section>

      </div>
    </div>
  )
}
