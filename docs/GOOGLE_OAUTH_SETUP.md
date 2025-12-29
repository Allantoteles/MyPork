# Configuración de Google OAuth en Supabase

## Configuración en Supabase Dashboard

1. **Habilitar Google Provider**
   - Ve a: [Authentication → Providers](https://supabase.com/dashboard/project/rusnyoebnmqrbacgtgmx/auth/providers)
   - Activa "Google"
   - Configura Client ID y Client Secret de tu app de Google Cloud Console

2. **URLs de Redirect Autorizadas**
   
   Para desarrollo local:
   ```
   http://localhost:3000/auth/callback
   ```
   
   Para producción (Cloudflare Workers):
   ```
   https://mypork.allantoteles.workers.dev/auth/callback
   ```

3. **Configurar en Google Cloud Console**
   - Ve a: https://console.cloud.google.com/apis/credentials
   - Crea credenciales OAuth 2.0
   - Añade URIs de redireccionamiento autorizadas:
     ```
     http://localhost:3000/auth/callback
     https://rusnyoebnmqrbacgtgmx.supabase.co/auth/v1/callback
     https://mypork.allantoteles.workers.dev/auth/callback
     ```

## Flujo OAuth

1. Usuario hace clic en "Continuar con Google" en `/login`
2. Se ejecuta `signInWithGoogle()` action
3. Supabase redirige a Google para autenticación
4. Google redirige de vuelta a `/auth/callback?code=...`
5. El callback intercambia el código por sesión
6. Usuario es redirigido a home (`/`) o a onboarding si falta perfil

## Troubleshooting

- **Error "redirect_uri_mismatch"**: Las URLs de redirect en Supabase y Google deben coincidir exactamente.
- **Middleware bloqueando callback**: El middleware ahora permite `/auth/callback` sin redirecciones.
- **Session no persiste**: Verifica que las cookies se establezcan correctamente en el callback.
