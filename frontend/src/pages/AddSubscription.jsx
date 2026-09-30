import SubscriptionForm from '../components/subscriptions/SubscriptionForm'
import { createSubscription } from '../services/subscription'

function AddSubscription() {
  async function handleCreate(payload) {
    await createSubscription(payload)
  }

  return (
    <div className="page">
      <div className="page__head">
        <h2 className="page__title">Add Subscription</h2>
        <p className="page__subtitle">
          Register a new platform subscription with country-based pricing.
        </p>
      </div>

      <div className="card">
        <SubscriptionForm
          submitLabel="Save Subscription"
          successMessage="Subscription saved successfully."
          onSubmit={handleCreate}
        />
      </div>
    </div>
  )
}

export default AddSubscription