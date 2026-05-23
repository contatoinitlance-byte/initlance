import supabase from '@/api/supabaseClient';

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export async function uploadProfileImage(file, email) {
  if (!file) return null;

  const extension = file.name.split('.').pop() || 'png';
  const safeEmail = email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const path = `${safeEmail}/${Date.now()}.${extension}`;

  if (supabase?.storage) {
    const { error } = await supabase.storage
      .from('profile-images')
      .upload(path, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from('profile-images').getPublicUrl(path);
      if (data?.publicUrl) return data.publicUrl;
    }

    console.warn('Profile image bucket upload failed, using data URL fallback:', error);
  }

  return readAsDataUrl(file);
}
