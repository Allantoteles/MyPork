-- Ejecutar en SQL Editor de Supabase
create policy "Borrar ejercicios" 
on public.ejercicios 
for delete 
using (auth.uid() = usuario_id);
