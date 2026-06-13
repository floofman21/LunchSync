import * as Contacts from 'expo-contacts';

// Returns a contact's name for use in team invites.
// Call this from ProfileView when you add the "invite from contacts" feature.
export async function pickContact() {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name],
  });
  // TODO: show a contact picker UI, return the selected contact's name
  // For now this returns the full list for you to build a picker from.
  return data;
}
