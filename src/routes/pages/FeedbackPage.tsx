import { VapiClient } from "@vapi-ai/server-sdk"

export default function FeedbackPage() {
  const client = new VapiClient({
    token: "bdabc4b2-06a4-4552-bd5b-819263e4439e",
  })

  const createCall = async () => {
    const res = await fetch("https://api.vapi.ai/phone-number", {
      method: "POST",
      headers: {
        Authorization: `Bearer a07be3f5-7635-481c-b020-fb12eec59c00`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: "vapi",
        assistantId: "e2485254-a7dc-4fdb-976f-2ca4647148af",
        numberDesiredAreaCode: "216",
      }),
    })
    const phoneNumber = await res.json()
    console.log(phoneNumber)
    const call = await Vapi.calls.create({
      assistant: { assistantId: "e2485254-a7dc-4fdb-976f-2ca4647148af" },
      phoneNumberId: phoneNumber.id,
      customer: { number: phoneNumber.number },
    })
    console.log(call.id)
  }
  return (
    <div className="flex items-center justify-center h-screen">
      <button onClick={createCall}>Create Call</button>
    </div>
  )
}
