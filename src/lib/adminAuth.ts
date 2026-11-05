import { cookies, headers } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "uktc_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 ;   


function getSecretKey(): string | null {
  const env_sec = process.env.ADMIN_SECRET_KEY?.trim() ;
  if( env_sec ) return env_sec ;   

  if( process.env.NODE_ENV === "production" ){
    console.error("CRITICAL: ADMIN_SECRET_KEY is not configured in production!") ;
    return null ;
  }


  return "uktc2026admin" ;
}

function safeCompare( a_str: string, b_str: string ): boolean {
  const bufA = Buffer.from( a_str ) ;
  const bufB = Buffer.from( b_str ) ;   
  if( bufA.length !== bufB.length ) return false ;

  return crypto.timingSafeEqual( bufA, bufB ) ;
}


function signPayload( expTime: number, secret: string ): string {
  return crypto.createHmac("sha256", secret).update(`uktc_adm_${expTime}`).digest("hex") ;   
}

export async function verifyAdminAuth(): Promise<boolean> {
  const secret = getSecretKey() ;
  if( !secret ) return false ;   

  const cookieStore = await cookies();
  let sessionToken = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionToken) {
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      sessionToken = authHeader.substring(7).trim();
    } else {
      sessionToken = reqHeaders.get("x-admin-token") || undefined;
    }
  }

  if (!sessionToken) return false;

  const parts = sessionToken.split(".") ;
  if( parts.length !== 2 ) return false ;   

  const expTime = Number( parts[0] ) ;
  const sig = parts[1] || "" ;

  if( !expTime || Number.isNaN( expTime ) || Date.now() > expTime ){
    return false ;
  }


  const expectedSig = signPayload( expTime, secret ) ;
  return safeCompare( sig, expectedSig ) ;


}

export function generateAdminToken(enteredSecret: string): string | null {
  const secret = getSecretKey() ;
  if( !secret ) return null ;   

  if( safeCompare( enteredSecret.trim(), secret ) ){
    const exp = Date.now()+ SESSION_TTL_MS ;
    const sig = signPayload( exp, secret ) ;   
    return `${exp}.${sig}` ;
  }

  return null;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;



