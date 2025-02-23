import React from 'react'
import '../styles/ErrorHandiling.css'

export default function ErrorHandling() {
  return (
    <div className='ErrorHandling'>
      <img src="./src/assets/images/404.png"/>
      <p>Page not found</p>
      <a href="/"><div className='Home'>Go to the Home page</div></a>
    </div>
  )
}
