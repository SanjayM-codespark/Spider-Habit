import './Placeholder.css'

function Placeholder({ title }) {
  return (
    <section className="placeholder">
      <h2 className="placeholder__title">{title}</h2>
      <p className="placeholder__text">
        This is placeholder content for the {title} section. Build your page
        here using the shared layout and UI components.
      </p>
    </section>
  )
}

export default Placeholder