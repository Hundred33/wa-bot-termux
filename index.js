const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const Pino = require('pino');
const { nomor } = require('./nomor');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, Pino().child({ level: 'silent', stream: 'store' }))
        },
        logger: Pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['TermuxBot', 'Chrome', '22.0.0']
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, pairingCode, isNewLogin } = update;

        if (pairingCode) {
            console.log(`\n📲 Pairing Code:\n➡️  ${pairingCode}\nMasukkan di WhatsApp: Perangkat Tertaut > Tautkan perangkat > Masukkan Kode`);
        }

        if (connection === 'open') {
            console.log('✅ Terhubung ke WhatsApp!');
        }

        if (connection === 'close') {
            console.log('❌ Koneksi terputus.');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    try {
        await sock.requestPairingCode(nomor);
    } catch (err) {
        console.error('❌ Gagal meminta pairing code:', err);
    }
}

startBot();
