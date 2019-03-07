export default async function requestPermission() {
  if (!Notification) {
    throw new Error('Notification not supported')
  }

  const result = await new Promise((resolve, reject) => {
    const permissionResult = Notification.requestPermission(result =>
      resolve(result)
    )

    if (permissionResult) {
      permissionResult.then(resolve, reject)
    }
  })

  if (result !== 'granted') {
    throw new Error("We weren't granted permission")
  }
}
