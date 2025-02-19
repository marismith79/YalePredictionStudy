
interface TeamMemberProps {
    name: string;
    department: string;
    title: string;
    image: string;
    link: string;
}

export default function TeamMember({ name, title, department, image, link }: TeamMemberProps) {
  return (
      <div className="team-container">
          <a href={link} target="email">
              <img className='team-member-img' src={image} alt={`${name}`} />
          </a>
          <h1>{name}</h1>
          <p>{department}</p>
          <p>{title}</p>

      </div>
  )
}
