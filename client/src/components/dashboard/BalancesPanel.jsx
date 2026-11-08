import { CreditCard, Landmark, PiggyBank, Wallet, TrendingUp, Car, GraduationCap, Home } from 'lucide-react'
import { ErrorNote, Meter, Panel, Skeleton } from '@/components/layout/Panel'
import { money, titleCase } from '@/lib/format'
import { cn } from '@/lib/utils'

const ASSET_TYPES = ['checking', 'savings', 'retirement', 'cd', 'investment']
const ACCOUNT_ICON = { checking: Wallet, savings: PiggyBank, retirement: TrendingUp, investment: TrendingUp, cd: Landmark, credit_card: CreditCard }
const LOAN_ICON = { auto: Car, student: GraduationCap, mortgage: Home }
const TYPE_LABEL = { cd: 'CD', credit_card: 'Credit card', retirement: 'Retirement (not spendable)' }

function Row({ icon: Icon, name, detail, amount, negative, children }) {
  return (
    <li className="border-t border-[#f0f2f5] py-2.5 first:border-t-0">
      <div className="flex items-center gap-[9px]">
        <span className="grid size-7 flex-none place-items-center rounded-lg bg-[#f0f3f7] text-strong">
          <Icon aria-hidden className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-[650] text-strong">{name}</div>
          <div className="truncate text-[10.5px] text-muted-foreground">{detail}</div>
        </div>
        <b className={cn('text-[12px]', negative ? 'text-red' : 'text-strong')}>{negative ? `−${money(amount)}` : money(amount)}</b>
      </div>
      {children}
    </li>
  )
}

const Group = ({ title, total, negative, children }) => (
  <div>
    <div className="mb-1 flex justify-between text-[9px] font-[650] tracking-[0.55px] text-[#99a3b1] uppercase">
      <span>{title}</span>
      <span className={negative ? 'text-red' : undefined}>{negative ? `−${money(total)}` : money(total)}</span>
    </div>
    <ul>{children}</ul>
  </div>
)

export function BalancesPanel({ overview }) {
  const o = overview.data
  return (
    <Panel id="balances" title="Balances & net worth" sub="Cash, investments and debts, kept separate">
      {overview.error ? (
        <ErrorNote error={overview.error} onRetry={overview.retry} />
      ) : overview.loading ? (
        <Skeleton className="h-48" />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 rounded-[11px] border border-line bg-soft p-[13px]">
            <div>
              <div className="text-[11px] text-muted-foreground">Net worth</div>
              <div className={cn('text-[22px] font-[730] tracking-[-0.5px]', o.totals.netWorthCents < 0 && 'text-red')}>
                {money(o.totals.netWorthCents)}
              </div>
            </div>
            <dl className="flex gap-5 text-[11px] text-muted-foreground">
              <div><dt>Spendable cash</dt><dd className="font-bold text-strong">{money(o.cash.availableCents)}</dd></div>
              <div><dt>Retirement & investments</dt><dd className="font-bold text-strong">{money(o.totals.retirementAndInvestmentsCents)}</dd></div>
              <div><dt>Total debt</dt><dd className="font-bold text-red">{money(o.totals.creditCardDebtCents + o.totals.loanDebtCents)}</dd></div>
            </dl>
          </div>

          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            <Group title="What you have" total={o.cash.availableCents + o.totals.retirementAndInvestmentsCents}>
              {o.accounts.filter((a) => ASSET_TYPES.includes(a.type)).map((a) => (
                <Row key={a.id} icon={ACCOUNT_ICON[a.type] ?? Wallet} name={a.name} detail={TYPE_LABEL[a.type] ?? titleCase(a.type)} amount={a.balanceCents} />
              ))}
            </Group>

            <Group title="What you owe" total={o.totals.creditCardDebtCents + o.totals.loanDebtCents} negative>
              {o.accounts.filter((a) => a.type === 'credit_card').map((a) => {
                const used = a.creditLimitCents ? a.balanceCents / a.creditLimitCents : null
                return (
                  <Row
                    key={a.id}
                    icon={CreditCard}
                    name={a.name}
                    detail={used === null ? 'Credit card' : `${Math.round(used * 100)}% of ${money(a.creditLimitCents)} limit used`}
                    amount={a.balanceCents}
                    negative
                  >
                    {used !== null && (
                      <div className="mt-2 ml-[37px]">
                        <Meter value={used} tone={used > 0.7 ? 'bad' : used > 0.3 ? 'warn' : 'good'} label={`${a.name} credit used`} />
                      </div>
                    )}
                  </Row>
                )
              })}
              {o.loans.map((l) => (
                <Row
                  key={l.id}
                  icon={LOAN_ICON[l.loanType] ?? Landmark}
                  name={l.name}
                  detail={`${money(l.monthlyPaymentCents)}/mo · ${(l.annualRateBps / 100).toFixed(1)}% APR`}
                  amount={l.outstandingCents}
                  negative
                />
              ))}
              {!o.loans.length && !o.accounts.some((a) => a.type === 'credit_card') && (
                <li className="py-2.5 text-[11px] text-muted-foreground">No debts on file.</li>
              )}
            </Group>
          </div>
        </>
      )}
    </Panel>
  )
}
