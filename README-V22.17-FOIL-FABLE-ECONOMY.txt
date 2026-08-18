REPO COMPANY — V22.17 FOIL & FABLE ECONOMY

Base: V22.16 Quidditch Background XP

Implemented:
- Clicking Gregg now opens a Foil & Fable three-service hub inspired by the supplied pixel-art reference.
- Existing slab cracking remains fully available from CRACK SLABS.
- New Fable Voucher currency stored authoritatively in Supabase.
- SELL SLABS TO GREGG with server-calculated values by rarity and RCG grade.
- Five-card GLOBAL daily Fable Shop. Every player sees the same five cards.
- Each slot has one global copy. When anybody buys it, it is SOLD OUT for everybody.
- Each player can buy a maximum of one shop card per Europe/London calendar day.
- Atomic row/advisory locking protects against two users buying the same card.
- Purchased cards are raw physical TCG copies and participate in duplicate/Bulk Box/RCG systems.
- World Cup, event and limited cards never enter the daily shop and protected event slabs cannot be sold.
- Daily stock polling refreshes sold status while the shop is open.
- Daily refresh countdown uses authoritative server timestamps.
- Admin tools: voucher adjustment, preview roll, reroll UNSOLD live slots, transaction history.

BALANCE
RCG grade multipliers: 8 = 1.00x, 9 = 1.50x, 10 = 2.50x.

Rarity            Base Sale   Shop Price   Daily Weight
Standard               500       10,000       35.0%
Full Art             1,000       20,000       20.0%
Off the Broom        1,500       30,000       13.0%
Patch                2,000       45,000       10.0%
Unfinished           2,750       60,000        7.0%
Promo                3,500       80,000        5.0%
Platinum             5,000      120,000        4.0%
Rival                7,500      170,000        2.8%
Gold Legendary      12,500      250,000        1.7%
Signature           20,000      400,000        0.8%
Millennium          35,000      650,000        0.5%
Black Label         75,000    1,000,000        0.2%

The included SQL migration has been applied live to Supabase for this build.
