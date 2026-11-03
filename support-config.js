/* Set only after verifying the developer controls the destination.
   Do NOT store API keys, payment details or checkout logic in this project. */
export const DONATION_URL = '';

export function configuredDonationUrl(value = DONATION_URL) {
  if(typeof value!=='string'||!value.trim())return '';
  try {
    const url=new URL(value);
    if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash)return '';
    const host=url.hostname.toLowerCase();
    const path=url.pathname;
    const githubSponsor=host==='github.com' && /^\/sponsors\/[a-z0-9-]+\/?$/i.test(path);
    const provider=(host==='ko-fi.com'||host==='www.ko-fi.com'
      ||host==='buymeacoffee.com'||host==='www.buymeacoffee.com'
      ||host==='paypal.me'||host==='www.paypal.me') && /^\/[a-z0-9._-]+\/?$/i.test(path);
    return (provider||githubSponsor)?url.href:'';
  }catch{return '';}
}
