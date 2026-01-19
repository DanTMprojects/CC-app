export function generateInviteToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function createInviteLink(token) {
  const baseUrl = window.location.origin;
  return `${baseUrl}/#/Onboarding?invite=${token}`;
}

export function getInviteTokenFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("invite");
}