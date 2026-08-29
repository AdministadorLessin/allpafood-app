import './TitleCard.scss';

const TitleCard = ({title,icon}) => {
    return (
        <div className="titleCard">
            <div className="ico">
                {icon}
            </div>
            <h3>{title}</h3>
        </div>
    )
};

export default TitleCard;
