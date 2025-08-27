async function deleteAllData() {
  await Storage.delete(today.date);
  await Storage.delete(STORAGE_KEY_GENERAL);
}
