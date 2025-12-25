import { createClient } from "@supabase/supabase-js";

  const supabaseUrl = "https://ikkubxzshghcetzljgdc.supabase.com";
  const supabaseAnonKey = "sb_publishable_o9GE3W3XleOkM6flVSyVdA_p8_6-d9m";

   const supabase = createClient(supabaseUrl, supabaseAnonKey);

  export default supabase;