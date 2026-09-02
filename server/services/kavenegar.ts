export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  
  if (!apiKey) {
    console.error('[Kavenegar] KAVENEGAR_API_KEY is not defined in .env');
    console.log(`[Kavenegar Dev Mode] Sent OTP ${code} to ${phone}`);
    return true;
  }

  try {
    // Using Kavenegar Lookup API (Verify) for OTPs to bypass blacklists
    // Note: You must create a template named 'verify' in your Kavenegar panel
    const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json?receptor=${phone}&token=${code}&template=verify`;
    
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    
    if (data.return && data.return.status === 200) {
      console.log(`[Kavenegar] OTP sent successfully to ${phone}`);
      return true;
    } else {
      console.error('[Kavenegar] API Error:', data.return?.message);
      return false;
    }
  } catch (error) {
    console.error('[Kavenegar] Network error:', error);
    return false;
  }
}
