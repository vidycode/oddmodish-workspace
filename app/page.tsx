import Link from "next/link";
import { navigation } from "@/src/config/navigation";
import { activity, attention, metrics, team } from "@/src/data/demo";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brandMark">O</span><span>Oddmodish <small>OS</small></span></div>
      <button className="quickAdd">＋ Quick add</button>
      <nav aria-label="Primary navigation">
        {navigation.map((item, index) => (
          <Link className={index === 0 ? "navItem active" : "navItem"} href={item.href} key={item.href}>
            <span aria-hidden>{item.icon}</span>{item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebarFoot">
        <div className="avatar">OL</div>
        <div><strong>Operations Lead</strong><small>Agency Operations Lead</small></div>
        <span>•••</span>
      </div>
    </aside>
  );
}

export default function ControlTower() {
  return (
    <main className="shell">
      <Sidebar />
      <section className="workspace">
        <header className="topbar">
          <div className="search">⌕ <span>Search anything or press</span><kbd>⌘ K</kbd></div>
          <div className="topActions"><button>◷ 01:23:18</button><button>♢</button><button className="aiButton">✦ Ask Oddmodish</button></div>
        </header>

        <div className="content">
          <div className="eyebrow">THURSDAY, 11 SEPTEMBER</div>
          <div className="pageTitle"><div><h1>Good afternoon, Operations Lead</h1><p>Here is what needs your attention across Oddmodish today.</p></div><button className="primary">＋ Create work</button></div>

          <section className="aiBrief">
            <div className="spark">✦</div>
            <div><strong>Daily operations brief</strong><p><b>4 items need intervention.</b> Client Atlas has three unresolved replacements, Writer A is nearing capacity, and one sample Reddit account has elevated risk. Client Beacon is nearly report-ready.</p></div>
            <button>Review insights →</button>
          </section>

          <section className="metrics" aria-label="Operations metrics">
            {metrics.map((metric) => <article className={`metric ${metric.tone}`} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.delta}</small></article>)}
          </section>

          <div className="dashboardGrid">
            <section className="panel attentionPanel">
              <div className="panelHeader"><div><h2>Today&apos;s attention</h2><p>Ranked automatically by deadline, dependencies and client impact.</p></div><button>View all</button></div>
              <div className="attentionList">
                {attention.map((row) => <article className="attentionRow" key={row.item}><div className={`urgency u${Math.floor(row.urgency / 10)}`}>{row.urgency}</div><div className="attentionText"><strong>{row.item}</strong><span>{row.reason}</span></div><div className="owner"><span>{row.owner.slice(0, 1)}</span>{row.owner}</div><button>Open</button></article>)}
              </div>
            </section>

            <section className="panel healthPanel">
              <div className="panelHeader"><div><h2>Client health</h2><p>Delivery and reporting signal</p></div><button>•••</button></div>
              {[['Client Beacon', 92, 'Healthy'], ['Client Atlas', 54, 'At risk'], ['Client Delta', 81, 'Healthy'], ['Client Cedar', 73, 'Watch']].map(([name, score, label]) => <div className="healthRow" key={name}><div><strong>{name}</strong><span>{label}</span></div><div className="scoreTrack"><i style={{width: `${score}%`}} /></div><b>{score}</b></div>)}
            </section>

            <section className="panel teamPanel">
              <div className="panelHeader"><div><h2>Team pulse</h2><p>Current activity and weekly load</p></div><button>Open workload</button></div>
              <div className="teamGrid">{team.map((person) => <article key={person.name}><div className="personHead"><span>{person.name.slice(0, 1)}</span><div><strong>{person.name}</strong><small>{person.role}</small></div><b className="online">●</b></div><p>{person.task}</p><div className="load"><i style={{width: `${person.load}%`}} /></div><small>{person.load}% planned · active since {person.since}</small></article>)}</div>
            </section>

            <section className="panel activityPanel">
              <div className="panelHeader"><div><h2>Live activity</h2><p>Auditable team and system history</p></div><button>Full history</button></div>
              {activity.map(([time, text], index) => <div className="activityRow" key={text}><time>{time}</time><i className={index === 2 ? "systemDot" : "humanDot"} /><span>{text}</span></div>)}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
