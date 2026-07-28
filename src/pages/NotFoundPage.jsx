import { Link } from "../app/router.jsx";
export default function NotFoundPage(){return <div className="content-page not-found"><span>404</span><h1>Страница не найдена</h1><p>Возможно, материал был перемещён или ещё не опубликован.</p><Link className="button button--dark" to="/">На главную</Link></div>}
