const API_URL="https://farmotor-s-transport-en-dev.onrender.com";
const DISCORD_CLIENT_ID="1479893449980514464";
const DISCORD_REDIRECT_URI="REMPLACE_PAR_TON_URL_DE_CALLBACK";
const DISCORD_OAUTH_URL=`https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&scope=identify`;
