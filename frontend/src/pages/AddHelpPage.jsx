import HelpPageForm from '../components/help/HelpPageForm'
import { createHelpPage } from '../services/helpPage'
import './HelpPage.css'

function AddHelpPage() {
  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h2 className="page__title">Add Help Page</h2>
          <p className="page__subtitle">
            Create a page shown under Help &amp; Support in the mobile app. Use the editor
            toolbar to format it.
          </p>
        </div>
      </div>

      <div className="card help__card">
        <HelpPageForm
          submitLabel="Save Page"
          successMessage="Help page added successfully."
          onSubmit={createHelpPage}
        />
      </div>
    </div>
  )
}

export default AddHelpPage
